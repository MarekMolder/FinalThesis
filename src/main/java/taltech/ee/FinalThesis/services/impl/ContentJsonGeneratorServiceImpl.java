package taltech.ee.FinalThesis.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.services.ContentJsonGeneratorService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContentJsonGeneratorServiceImpl implements ContentJsonGeneratorService {

    private final CurriculumVersionRepository versionRepository;
    private final CurriculumItemRepository itemRepository;
    private final CurriculumItemRelationRepository relationRepository;
    private final CurriculumItemScheduleRepository scheduleRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public String generateAndSave(UUID versionId, UUID userId) {
        CurriculumVersion version = versionRepository
                .findById(versionId)
                .filter(v -> v.getCurriculum().getUser().getId().equals(userId))
                .orElseThrow(() -> new CurriculumVersionNotFoundException(
                        "Version not found: " + versionId));

        List<CurriculumItem> items = itemRepository.findAllWithParentByCurriculumVersion_Id(versionId);
        List<CurriculumItemRelation> relations = relationRepository.findAllByCurriculumVersion_Id(versionId);
        List<CurriculumItemSchedule> schedules = scheduleRepository.findByCurriculumItem_CurriculumVersion_Id(versionId);

        ObjectNode root = objectMapper.createObjectNode();
        root.put("format_version", "1.0");

        // curriculum_root
        ObjectNode currRoot = root.putObject("curriculum_root");
        currRoot.put("id", version.getCurriculum().getId().toString());
        currRoot.put("type", "curriculum");
        currRoot.put("title", version.getCurriculum().getTitle() != null ? version.getCurriculum().getTitle() : "");
        currRoot.put("description", version.getCurriculum().getDescription() != null ? version.getCurriculum().getDescription() : "");
        currRoot.put("version_id", version.getId().toString());
        ObjectNode semFields = currRoot.putObject("semantic_fields");
        semFields.put("schema:name", version.getCurriculum().getTitle() != null ? version.getCurriculum().getTitle() : "");
        semFields.put("schema:provider", version.getCurriculum().getProvider() != null ? version.getCurriculum().getProvider() : "");
        semFields.put("schema:inLanguage", version.getCurriculum().getLanguage() != null ? version.getCurriculum().getLanguage() : "");
        ObjectNode currPublish = currRoot.putObject("publish");
        currPublish.put("create_if_missing", version.getCurriculum().getExternalPageIri() == null);
        currPublish.putNull("external_iri");
        currPublish.putNull("published_iri");

        // items
        ArrayNode itemsArr = root.putArray("items");
        for (CurriculumItem item : items) {
            ObjectNode n = itemsArr.addObject();
            n.put("id", item.getId().toString());
            n.put("curriculum_version_id", versionId.toString());
            if (item.getParentItem() != null) {
                n.put("parent_item_id", item.getParentItem().getId().toString());
            } else {
                n.putNull("parent_item_id");
            }
            n.put("item_type", item.getType().name().toLowerCase());
            n.put("title", item.getTitle());
            n.put("description", item.getDescription() != null ? item.getDescription() : "");
            n.put("order_index", item.getOrderIndex());
            n.put("source_type", item.getSourceType().name().toLowerCase());
            n.put("external_iri", item.getExternalIri());
            n.put("local_key", item.getLocalKey() != null ? item.getLocalKey() : "");
            n.put("subject_iri", item.getSubjectIri() != null ? item.getSubjectIri() : "");
            n.put("subject_area_iri", item.getSubjectAreaIri() != null ? item.getSubjectAreaIri() : "");
            n.put("educational_level_iri", item.getEducationLevelIri());
            n.put("school_level", item.getSchoolLevel());
            n.put("grade", item.getGrade());
            n.put("educational_framework", item.getEducationalFramework().name().toLowerCase());
            n.put("notation", item.getNotation());
            n.put("verb_iri", item.getVerbIri());
            n.put("is_mandatory", item.getIsMandatory());
            ObjectNode pub = n.putObject("publish");
            pub.put("create_if_missing", item.getExternalIri() == null);
            pub.put("external_iri", item.getExternalIri());
            pub.putNull("published_iri");
        }

        // relations
        ArrayNode relArr = root.putArray("relations");
        for (CurriculumItemRelation rel : relations) {
            ObjectNode n = relArr.addObject();
            n.put("id", rel.getId().toString());
            n.put("curriculum_version_id", versionId.toString());
            if (rel.getSourceItem() != null) {
                n.put("source_item_id", rel.getSourceItem().getId().toString());
            } else {
                n.putNull("source_item_id");
            }
            if (rel.getTargetItem() != null) {
                n.put("target_item_id", rel.getTargetItem().getId().toString());
            } else {
                n.putNull("target_item_id");
            }
            n.put("target_external_iri", rel.getTargetExternalIri());
            n.put("relation_type", rel.getType().name().toLowerCase());
        }

        // schedule
        ArrayNode schedArr = root.putArray("schedule");
        for (CurriculumItemSchedule s : schedules) {
            ObjectNode n = schedArr.addObject();
            n.put("id", s.getId().toString());
            n.put("curriculum_item_id", s.getCurriculumItem().getId().toString());
            if (s.getPlannedStartAt() != null) {
                n.put("planned_start_at", s.getPlannedStartAt().toString());
            } else {
                n.putNull("planned_start_at");
            }
            if (s.getPlannedEndAt() != null) {
                n.put("planned_end_at", s.getPlannedEndAt().toString());
            } else {
                n.putNull("planned_end_at");
            }
            n.put("planned_minutes", s.getPlannedMinutes());
            n.put("status", s.getStatus().name().toLowerCase());
            n.put("schedule_notes", s.getScheduleNotes() != null ? s.getScheduleNotes() : "");
        }

        // publish_variants
        ObjectNode variants = root.putObject("publish_variants");
        ObjectNode full = variants.putObject("full_curriculum_publish");
        full.put("description", "Publish all items");
        ArrayNode fullIds = full.putArray("include_item_ids");
        items.forEach(i -> fullIds.add(i.getId().toString()));

        ObjectNode teacherOnly = variants.putObject("teacher_created_only_publish");
        teacherOnly.put("description", "Publish only teacher-created items");
        ArrayNode teacherIds = teacherOnly.putArray("include_item_ids");
        items.stream()
                .filter(i -> i.getSourceType() == CurriculumItemSourceTypeEnum.TEACHER_CREATED)
                .forEach(i -> teacherIds.add(i.getId().toString()));

        try {
            String json = objectMapper.writeValueAsString(root);
            version.setContentJson(json);
            versionRepository.save(version);
            return json;
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize content_json", e);
        }
    }
}
