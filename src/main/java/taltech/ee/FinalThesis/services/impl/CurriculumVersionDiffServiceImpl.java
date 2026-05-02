package taltech.ee.FinalThesis.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.dto.diff.DiffResultDto;
import taltech.ee.FinalThesis.domain.dto.diff.DiffSummaryDto;
import taltech.ee.FinalThesis.domain.dto.diff.FieldChangeDto;
import taltech.ee.FinalThesis.domain.dto.diff.ItemDiffDto;
import taltech.ee.FinalThesis.domain.dto.diff.RelationDiffDto;
import taltech.ee.FinalThesis.domain.dto.diff.VersionRefDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.ItemDiffStatus;
import taltech.ee.FinalThesis.domain.enums.RelationDiffStatus;
import taltech.ee.FinalThesis.exceptions.DiffValidationException;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.CurriculumVersionDiffService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurriculumVersionDiffServiceImpl implements CurriculumVersionDiffService {

    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;

    @Override
    public DiffResultDto diff(UUID versionAId, UUID versionBId, UUID userId) {
        if (versionAId.equals(versionBId)) {
            throw new DiffValidationException("Cannot diff a version against itself");
        }
        CurriculumVersion vA = curriculumVersionRepository
                .findByIdAndCurriculum_User_Id(versionAId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(
                        "Version not found: " + versionAId));
        CurriculumVersion vB = curriculumVersionRepository
                .findByIdAndCurriculum_User_Id(versionBId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(
                        "Version not found: " + versionBId));
        if (!vA.getCurriculum().getId().equals(vB.getCurriculum().getId())) {
            throw new DiffValidationException("Versions belong to different curriculums");
        }

        List<CurriculumItem> itemsA = curriculumItemRepository
                .findAllWithParentByCurriculumVersion_Id(versionAId);
        List<CurriculumItem> itemsB = curriculumItemRepository
                .findAllWithParentByCurriculumVersion_Id(versionBId);

        Map<CurriculumItem, String> keyA = buildMatchKeys(itemsA);
        Map<CurriculumItem, String> keyB = buildMatchKeys(itemsB);

        Map<String, CurriculumItem> indexA = invert(keyA);
        Map<String, CurriculumItem> indexB = invert(keyB);

        int unmatchable = countUnmatchable(itemsA) + countUnmatchable(itemsB);

        Set<String> allKeys = new LinkedHashSet<>();
        // Order: B-first so ADDED items appear in B's order; then any A-only.
        for (CurriculumItem i : itemsB) allKeys.add(keyB.get(i));
        for (CurriculumItem i : itemsA) allKeys.add(keyA.get(i));

        List<ItemDiffDto> itemRows = new ArrayList<>();
        DiffSummaryDto summary = DiffSummaryDto.builder().build();

        for (String mk : allKeys) {
            CurriculumItem a = indexA.get(mk);
            CurriculumItem b = indexB.get(mk);
            ItemDiffDto row = classify(mk, a, b, keyA, keyB);
            itemRows.add(row);
            switch (row.getStatus()) {
                case ADDED -> summary.setItemsAdded(summary.getItemsAdded() + 1);
                case REMOVED -> summary.setItemsRemoved(summary.getItemsRemoved() + 1);
                case MODIFIED -> summary.setItemsModified(summary.getItemsModified() + 1);
                case UNCHANGED -> summary.setItemsUnchanged(summary.getItemsUnchanged() + 1);
            }
        }

        List<CurriculumItemRelation> relsA = curriculumItemRelationRepository
                .findAllByCurriculumVersion_Id(versionAId);
        List<CurriculumItemRelation> relsB = curriculumItemRelationRepository
                .findAllByCurriculumVersion_Id(versionBId);

        Set<String> tripleA = relationTripleSet(relsA, keyA);
        Set<String> tripleB = relationTripleSet(relsB, keyB);

        List<RelationDiffDto> relationRows = new ArrayList<>();
        for (CurriculumItemRelation r : relsB) {
            String t = relationTriple(r, keyB);
            if (t != null && !tripleA.contains(t)) {
                relationRows.add(toRelationDiff(r, keyB, RelationDiffStatus.ADDED));
                summary.setRelationsAdded(summary.getRelationsAdded() + 1);
            }
        }
        for (CurriculumItemRelation r : relsA) {
            String t = relationTriple(r, keyA);
            if (t != null && !tripleB.contains(t)) {
                relationRows.add(toRelationDiff(r, keyA, RelationDiffStatus.REMOVED));
                summary.setRelationsRemoved(summary.getRelationsRemoved() + 1);
            }
        }

        return DiffResultDto.builder()
                .versionA(toRef(vA))
                .versionB(toRef(vB))
                .summary(summary)
                .items(itemRows)
                .relations(relationRows)
                .unmatchableItemsNote(unmatchable)
                .build();
    }

    private static Map<CurriculumItem, String> buildMatchKeys(List<CurriculumItem> items) {
        Map<CurriculumItem, String> keys = new LinkedHashMap<>();
        for (CurriculumItem i : items) {
            keys.put(i, matchKey(i));
        }
        return keys;
    }

    private static String matchKey(CurriculumItem i) {
        if (i.getExternalIri() != null && !i.getExternalIri().isBlank()) {
            return "iri:" + i.getExternalIri();
        }
        if (i.getLocalKey() != null && !i.getLocalKey().isBlank()) {
            return "lk:" + i.getLocalKey();
        }
        // Synthetic per-item key — guarantees uniqueness so unmatched items stay distinct.
        return "syn:" + i.getId();
    }

    private static int countUnmatchable(List<CurriculumItem> items) {
        int n = 0;
        for (CurriculumItem i : items) {
            boolean noIri = i.getExternalIri() == null || i.getExternalIri().isBlank();
            boolean noKey = i.getLocalKey() == null || i.getLocalKey().isBlank();
            if (noIri && noKey) n++;
        }
        return n;
    }

    /**
     * Inverts a (item → matchKey) map into (matchKey → item).
     * <p>
     * Assumes matchKeys are unique within a single version. If two items in the
     * same version share an externalIri or localKey, the second silently overwrites
     * the first. This is a data-quality concern, not a diff-algorithm concern —
     * the database does not enforce per-version uniqueness on those columns.
     */
    private static Map<String, CurriculumItem> invert(Map<CurriculumItem, String> keys) {
        Map<String, CurriculumItem> out = new LinkedHashMap<>();
        for (Map.Entry<CurriculumItem, String> e : keys.entrySet()) {
            out.put(e.getValue(), e.getKey());
        }
        return out;
    }

    private static ItemDiffDto classify(String matchKey,
                                        CurriculumItem a,
                                        CurriculumItem b,
                                        Map<CurriculumItem, String> keysA,
                                        Map<CurriculumItem, String> keysB) {
        ItemDiffDto.ItemDiffDtoBuilder row = ItemDiffDto.builder()
                .matchKey(matchKey)
                .itemAId(a != null ? a.getId() : null)
                .itemBId(b != null ? b.getId() : null)
                .titleA(a != null ? a.getTitle() : null)
                .titleB(b != null ? b.getTitle() : null)
                .type(b != null ? safeEnumName(b.getType()) : safeEnumName(a.getType()))
                .parentMatchKey(parentMatchKeyOf(a, b, keysA, keysB))
                .fieldChanges(new ArrayList<>());

        if (a == null) return row.status(ItemDiffStatus.ADDED).build();
        if (b == null) return row.status(ItemDiffStatus.REMOVED).build();

        List<FieldChangeDto> changes = computeFieldChanges(a, b, keysA, keysB);
        row.fieldChanges(changes);
        row.status(changes.isEmpty() ? ItemDiffStatus.UNCHANGED : ItemDiffStatus.MODIFIED);
        return row.build();
    }

    private static String parentMatchKeyOf(CurriculumItem a, CurriculumItem b,
                                           Map<CurriculumItem, String> keysA,
                                           Map<CurriculumItem, String> keysB) {
        // Prefer B's parent if B exists (B is the "newer" side for tree rendering).
        if (b != null && b.getParentItem() != null) return keysB.get(b.getParentItem());
        if (a != null && a.getParentItem() != null) return keysA.get(a.getParentItem());
        return null;
    }

    private static List<FieldChangeDto> computeFieldChanges(CurriculumItem a, CurriculumItem b,
                                                            Map<CurriculumItem, String> keysA,
                                                            Map<CurriculumItem, String> keysB) {
        List<FieldChangeDto> changes = new ArrayList<>();
        addIfDifferent(changes, "title", a.getTitle(), b.getTitle());
        addIfDifferent(changes, "description", a.getDescription(), b.getDescription());
        addIfDifferent(changes, "type", safeEnumName(a.getType()), safeEnumName(b.getType()));
        addIfDifferent(changes, "orderIndex",
                a.getOrderIndex() == null ? null : a.getOrderIndex().toString(),
                b.getOrderIndex() == null ? null : b.getOrderIndex().toString());
        addIfDifferent(changes, "isMandatory",
                a.getIsMandatory() == null ? null : a.getIsMandatory().toString(),
                b.getIsMandatory() == null ? null : b.getIsMandatory().toString());
        addIfDifferent(changes, "topicLabel", a.getTopicLabel(), b.getTopicLabel());
        addIfDifferent(changes, "topicIri", a.getTopicIri(), b.getTopicIri());
        addIfDifferent(changes, "verbLabel", a.getVerbLabel(), b.getVerbLabel());
        addIfDifferent(changes, "verbIri", a.getVerbIri(), b.getVerbIri());
        addIfDifferent(changes, "subjectLabel", a.getSubjectLabel(), b.getSubjectLabel());
        addIfDifferent(changes, "subjectAreaLabel", a.getSubjectAreaLabel(), b.getSubjectAreaLabel());
        addIfDifferent(changes, "educationLevelLabel", a.getEducationLevelLabel(), b.getEducationLevelLabel());
        addIfDifferent(changes, "schoolLevel", a.getSchoolLevel(), b.getSchoolLevel());
        addIfDifferent(changes, "grade", a.getGrade(), b.getGrade());
        addIfDifferent(changes, "educationalFramework",
                safeEnumName(a.getEducationalFramework()), safeEnumName(b.getEducationalFramework()));
        addIfDifferent(changes, "notation", a.getNotation(), b.getNotation());
        addIfDifferent(changes, "sourceType",
                safeEnumName(a.getSourceType()), safeEnumName(b.getSourceType()));

        String parentA = a.getParentItem() != null ? keysA.get(a.getParentItem()) : null;
        String parentB = b.getParentItem() != null ? keysB.get(b.getParentItem()) : null;
        addIfDifferent(changes, "parent", parentA, parentB);

        return changes;
    }

    private static void addIfDifferent(List<FieldChangeDto> out, String field, String oldVal, String newVal) {
        if (Objects.equals(oldVal, newVal)) return;
        out.add(FieldChangeDto.builder().field(field).oldValue(oldVal).newValue(newVal).build());
    }

    private static String safeEnumName(Object o) {
        if (o == null) return null;
        if (o instanceof Enum<?> e) return e.name();
        return o.toString();
    }

    private static VersionRefDto toRef(CurriculumVersion v) {
        return VersionRefDto.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .state(v.getState())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private static String relationTriple(CurriculumItemRelation r, Map<CurriculumItem, String> keys) {
        if (r.getSourceItem() == null || r.getTargetItem() == null) return null;
        String src = keys.get(r.getSourceItem());
        String tgt = keys.get(r.getTargetItem());
        if (src == null || tgt == null) return null;
        return src + "|" + tgt + "|" + r.getType().name();
    }

    private static Set<String> relationTripleSet(List<CurriculumItemRelation> rels,
                                                 Map<CurriculumItem, String> keys) {
        Set<String> out = new java.util.HashSet<>();
        for (CurriculumItemRelation r : rels) {
            String t = relationTriple(r, keys);
            if (t != null) out.add(t);
        }
        return out;
    }

    private static RelationDiffDto toRelationDiff(CurriculumItemRelation r,
                                                  Map<CurriculumItem, String> keys,
                                                  RelationDiffStatus status) {
        return RelationDiffDto.builder()
                .sourceMatchKey(keys.get(r.getSourceItem()))
                .targetMatchKey(keys.get(r.getTargetItem()))
                .type(r.getType().name())
                .status(status)
                .build();
    }
}
