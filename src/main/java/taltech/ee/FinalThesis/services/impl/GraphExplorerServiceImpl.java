package taltech.ee.FinalThesis.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphEdgeKind;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLinkedPageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphResourcePageDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphNodeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphNodeKind;
import taltech.ee.FinalThesis.domain.dto.graph.GraphViewDto;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemRelation;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.exceptions.notFoundExceptions.CurriculumVersionNotFoundException;
import taltech.ee.FinalThesis.repositories.CurriculumItemRelationRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;
import taltech.ee.FinalThesis.services.GraphExplorerService;
import taltech.ee.FinalThesis.services.OppekavaGraphService;
import taltech.ee.FinalThesis.util.ExternalPageIriUtils;

import taltech.ee.FinalThesis.exceptions.GraphFetchException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphExplorerServiceImpl implements GraphExplorerService {

    private final CurriculumVersionRepository curriculumVersionRepository;
    private final CurriculumItemRepository curriculumItemRepository;
    private final CurriculumItemRelationRepository curriculumItemRelationRepository;
    private final OppekavaGraphService oppekavaGraphService;

    @Override
    public GraphViewDto getCurriculumGraph(UUID curriculumId, UUID versionId, UUID userId) {
        CurriculumVersion version = curriculumVersionRepository
                .findByIdAndCurriculum_User_Id(versionId, userId)
                .orElseThrow(() -> new CurriculumVersionNotFoundException(
                        "Version not found: " + versionId));
        List<CurriculumItem> items = curriculumItemRepository
                .findAllWithParentByCurriculumVersion_Id(versionId);
        List<CurriculumItemRelation> relations = curriculumItemRelationRepository
                .findAllByCurriculumVersion_Id(versionId);

        List<GraphNodeDto> nodes = new ArrayList<>();
        List<GraphEdgeDto> edges = new ArrayList<>();

        Map<String, GraphNodeDto> ownByIri = new LinkedHashMap<>();
        Map<String, String> ownIriIndex = new HashMap<>();
        List<GraphNodeDto> ownNodesNoIri = new ArrayList<>();

        for (CurriculumItem item : items) {
            String iri = item.getExternalIri();
            if (iri != null && !iri.isBlank()) {
                GraphNodeDto existing = ownByIri.get(iri);
                if (existing == null) {
                    GraphNodeDto n = toOwnNode(item);
                    ownByIri.put(iri, n);
                    ownIriIndex.put(iri, n.getId());
                } else {
                    int newCount = Integer.parseInt(existing.getMetadata().getOrDefault("count", "1")) + 1;
                    existing.getMetadata().put("count", String.valueOf(newCount));
                }
            } else {
                ownNodesNoIri.add(toOwnNode(item));
            }
        }
        nodes.addAll(ownByIri.values());
        nodes.addAll(ownNodesNoIri);

        for (CurriculumItem item : items) {
            if (item.getParentItem() == null) continue;
            String src = resolveOwnId(item, ownByIri);
            String tgt = resolveOwnId(item.getParentItem(), ownByIri);
            if (src == null || tgt == null || src.equals(tgt)) continue;
            edges.add(GraphEdgeDto.builder()
                    .sourceId(src)
                    .targetId(tgt)
                    .kind(GraphEdgeKind.PARENT_CHILD)
                    .label("kuulub")
                    .build());
        }

        for (CurriculumItemRelation r : relations) {
            if (r.getSourceItem() == null || r.getTargetItem() == null) continue;
            String src = resolveOwnId(r.getSourceItem(), ownByIri);
            String tgt = resolveOwnId(r.getTargetItem(), ownByIri);
            if (src == null || tgt == null) continue;
            edges.add(GraphEdgeDto.builder()
                    .sourceId(src)
                    .targetId(tgt)
                    .kind(GraphEdgeKind.INTERNAL_RELATION)
                    .label(r.getType().name())
                    .build());
        }

        // Track GRAPH_ITEM IRIs already added so we don't duplicate within the response.
        Set<String> graphItemIris = new LinkedHashSet<>();
        for (CurriculumItem item : items) {
            String iri = item.getExternalIri();
            if (iri == null || iri.isBlank()) continue;
            // Only the canonical (first-seen) item per externalIri fetches neighbours.
            // Skipping merged-away duplicates avoids emitting edges whose source UUID
            // is absent from the nodes list (cytoscape crashes on that).
            String canonicalId = ownIriIndex.get(iri);
            if (canonicalId == null || !canonicalId.equals(item.getId().toString())) continue;
            String pageTitle = ExternalPageIriUtils.pageTitleFromExternalPageIri(iri);
            if (pageTitle == null) continue;
            try {
                appendGraphNeighbours(item, pageTitle, nodes, edges, graphItemIris, ownIriIndex);
            } catch (Exception e) {
                log.warn("Graph neighbours failed for item {} ({}): {}",
                        item.getId(), pageTitle, e.getMessage());
            }
        }

        return GraphViewDto.builder().nodes(nodes).edges(edges).build();
    }

    @Override
    public GraphViewDto expand(String iri, List<String> excludeIris, UUID userId) {
        if (iri == null || iri.isBlank()) {
            return GraphViewDto.builder().build();
        }
        Set<String> exclude = excludeIris == null ? Set.of() : new HashSet<>(excludeIris);
        String pageTitle = ExternalPageIriUtils.pageTitleFromExternalPageIri(iri);
        if (pageTitle == null) {
            return GraphViewDto.builder().build();
        }

        List<GraphNodeDto> nodes = new ArrayList<>();
        List<GraphEdgeDto> edges = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        try {
            // 1. Treat the page as a learning outcome and emit its full relation set.
            GraphLearningOutcomeDto lo = oppekavaGraphService.getLearningOutcomeFromGraph(pageTitle);
            if (lo != null) {
                addExpandLinks(iri, lo.getEeldab(), GraphEdgeKind.GRAPH_REQUIRES, "eeldab",
                        "learning_outcome", exclude, seen, nodes, edges);
                addExpandLinks(iri, lo.getOnEelduseks(), GraphEdgeKind.GRAPH_REQUIRED_BY, "on eelduseks",
                        "learning_outcome", exclude, seen, nodes, edges);
                addExpandLinks(iri, lo.getKoosneb(), GraphEdgeKind.GRAPH_CONSISTS_OF, "koosneb",
                        "learning_outcome", exclude, seen, nodes, edges);
                addExpandLinks(iri, lo.getOnOsaks(), GraphEdgeKind.GRAPH_PART_OF, "on osaks",
                        "learning_outcome", exclude, seen, nodes, edges);
                addExpandLinks(iri, lo.getSeotudOpivaljund(), GraphEdgeKind.GRAPH_RELATED_LO, "seotud õpiväljund",
                        "learning_outcome", exclude, seen, nodes, edges);
                addExpandLinks(iri, lo.getSisaldabKnobitit(), GraphEdgeKind.GRAPH_CONTAINS_KNOBIT, "sisaldab knobitit",
                        "knobit", exclude, seen, nodes, edges);
                addExpandScalar(iri, lo.getTopicIri(), lo.getTopicLabel(), "theme",
                        GraphEdgeKind.GRAPH_HAS_THEME, "seotud teema",
                        exclude, seen, nodes, edges);
                addExpandScalar(iri, lo.getModuleIri(), lo.getModuleLabel(), "module",
                        GraphEdgeKind.GRAPH_BELONGS_TO_MODULE, "seotud moodul",
                        exclude, seen, nodes, edges);
                addExpandScalar(iri, lo.getCurriculumIri(), lo.getCurriculumLabel(), "curriculum",
                        GraphEdgeKind.GRAPH_BELONGS_TO_CURRICULUM, "seotud õppekava",
                        exclude, seen, nodes, edges);
            }

            // 2. Resources that link back to this page (kasutab).
            List<GraphResourcePageDto> users = oppekavaGraphService.findPagesLinkingToLearningOutcome(pageTitle);
            if (users != null) {
                for (GraphResourcePageDto p : users) {
                    String childIri = p.getFullUrl();
                    if (childIri == null || childIri.isBlank()) continue;
                    if (exclude.contains(childIri)) continue;
                    if (!seen.add(childIri)) continue;
                    nodes.add(GraphNodeDto.builder()
                            .id(childIri)
                            .kind(GraphNodeKind.GRAPH_ITEM)
                            .label(p.getSchemaName() != null ? p.getSchemaName() : p.getPageTitle())
                            .type(resourceTypeOf(p))
                            .externalIri(childIri)
                            .metadata(new LinkedHashMap<>())
                            .build());
                    edges.add(GraphEdgeDto.builder()
                            .sourceId(iri)
                            .targetId(childIri)
                            .kind(GraphEdgeKind.GRAPH_USES)
                            .label("kasutab")
                            .build());
                }
            }

            // 3. onOsa children (works for non-LO pages too).
            List<GraphLinkedPageDto> children = oppekavaGraphService.getOnOsaChildren(pageTitle);
            addExpandLinks(iri, children, GraphEdgeKind.GRAPH_CONSISTS_OF, "onOsa",
                    "learning_outcome", exclude, seen, nodes, edges);
        } catch (Exception e) {
            throw new GraphFetchException("Graph expand failed for " + iri, e);
        }
        return GraphViewDto.builder().nodes(nodes).edges(edges).build();
    }

    private static void addExpandLinks(String sourceIri,
                                       List<GraphLinkedPageDto> links,
                                       GraphEdgeKind edgeKind,
                                       String edgeLabel,
                                       String nodeType,
                                       Set<String> exclude,
                                       Set<String> seen,
                                       List<GraphNodeDto> nodes,
                                       List<GraphEdgeDto> edges) {
        if (links == null) return;
        for (GraphLinkedPageDto link : links) {
            String iri = link.getFullUrl();
            if (iri == null || iri.isBlank()) continue;
            if (exclude.contains(iri)) continue;
            if (!seen.add(iri)) continue;
            nodes.add(GraphNodeDto.builder()
                    .id(iri)
                    .kind(GraphNodeKind.GRAPH_ITEM)
                    .label(link.getFulltext())
                    .type(nodeType)
                    .externalIri(iri)
                    .metadata(new LinkedHashMap<>())
                    .build());
            edges.add(GraphEdgeDto.builder()
                    .sourceId(sourceIri)
                    .targetId(iri)
                    .kind(edgeKind)
                    .label(edgeLabel)
                    .build());
        }
    }

    private static void addExpandScalar(String sourceIri,
                                        String targetIri,
                                        String targetLabel,
                                        String nodeType,
                                        GraphEdgeKind edgeKind,
                                        String edgeLabel,
                                        Set<String> exclude,
                                        Set<String> seen,
                                        List<GraphNodeDto> nodes,
                                        List<GraphEdgeDto> edges) {
        if (targetIri == null || targetIri.isBlank()) return;
        if (exclude.contains(targetIri)) return;
        if (!seen.add(targetIri)) return;
        nodes.add(GraphNodeDto.builder()
                .id(targetIri)
                .kind(GraphNodeKind.GRAPH_ITEM)
                .label(targetLabel != null && !targetLabel.isBlank() ? targetLabel : targetIri)
                .type(nodeType)
                .externalIri(targetIri)
                .metadata(new LinkedHashMap<>())
                .build());
        edges.add(GraphEdgeDto.builder()
                .sourceId(sourceIri)
                .targetId(targetIri)
                .kind(edgeKind)
                .label(edgeLabel)
                .build());
    }

    private static GraphNodeDto toOwnNode(CurriculumItem item) {
        Map<String, String> meta = new LinkedHashMap<>();
        if (item.getSubjectLabel() != null) meta.put("subject", item.getSubjectLabel());
        if (item.getTopicLabel() != null) meta.put("topic", item.getTopicLabel());
        if (item.getGrade() != null) meta.put("grade", item.getGrade());
        if (item.getSchoolLevel() != null) meta.put("schoolLevel", item.getSchoolLevel());
        return GraphNodeDto.builder()
                .id(item.getId().toString())
                .kind(GraphNodeKind.OWN_ITEM)
                .label(item.getTitle())
                .type(item.getType().name().toLowerCase())
                .externalIri(item.getExternalIri())
                .metadata(meta)
                .build();
    }

    private void appendGraphNeighbours(CurriculumItem item, String pageTitle,
                                       List<GraphNodeDto> nodes, List<GraphEdgeDto> edges,
                                       Set<String> graphItemIris, Map<String, String> ownIriIndex) {
        if (item.getType() == CurriculumItemTypeEnum.LEARNING_OUTCOME) {
            GraphLearningOutcomeDto lo = oppekavaGraphService.getLearningOutcomeFromGraph(pageTitle);
            if (lo != null) {
                addLinkedNeighbours(item, lo.getEeldab(), GraphEdgeKind.GRAPH_REQUIRES, "eeldab",
                        "learning_outcome", nodes, edges, graphItemIris, ownIriIndex);
                addLinkedNeighbours(item, lo.getOnEelduseks(), GraphEdgeKind.GRAPH_REQUIRED_BY, "on eelduseks",
                        "learning_outcome", nodes, edges, graphItemIris, ownIriIndex);
                addLinkedNeighbours(item, lo.getKoosneb(), GraphEdgeKind.GRAPH_CONSISTS_OF, "koosneb",
                        "learning_outcome", nodes, edges, graphItemIris, ownIriIndex);
                addLinkedNeighbours(item, lo.getOnOsaks(), GraphEdgeKind.GRAPH_PART_OF, "on osaks",
                        "learning_outcome", nodes, edges, graphItemIris, ownIriIndex);
                addLinkedNeighbours(item, lo.getSeotudOpivaljund(), GraphEdgeKind.GRAPH_RELATED_LO, "seotud õpiväljund",
                        "learning_outcome", nodes, edges, graphItemIris, ownIriIndex);
                addLinkedNeighbours(item, lo.getSisaldabKnobitit(), GraphEdgeKind.GRAPH_CONTAINS_KNOBIT, "sisaldab knobitit",
                        "knobit", nodes, edges, graphItemIris, ownIriIndex);

                addScalarEdge(item, lo.getTopicIri(), lo.getTopicLabel(), "theme",
                        GraphEdgeKind.GRAPH_HAS_THEME, "seotud teema",
                        nodes, edges, graphItemIris, ownIriIndex);
                addScalarEdge(item, lo.getModuleIri(), lo.getModuleLabel(), "module",
                        GraphEdgeKind.GRAPH_BELONGS_TO_MODULE, "seotud moodul",
                        nodes, edges, graphItemIris, ownIriIndex);
                addScalarEdge(item, lo.getCurriculumIri(), lo.getCurriculumLabel(), "curriculum",
                        GraphEdgeKind.GRAPH_BELONGS_TO_CURRICULUM, "seotud õppekava",
                        nodes, edges, graphItemIris, ownIriIndex);
            }
            List<GraphResourcePageDto> users = oppekavaGraphService.findPagesLinkingToLearningOutcome(pageTitle);
            if (users != null) {
                for (GraphResourcePageDto p : users) {
                    String iri = p.getFullUrl();
                    if (iri == null || iri.isBlank()) continue;
                    String resolvedTarget = ownIriIndex.getOrDefault(iri, iri);
                    if (!ownIriIndex.containsKey(iri) && graphItemIris.add(iri)) {
                        nodes.add(GraphNodeDto.builder()
                                .id(iri)
                                .kind(GraphNodeKind.GRAPH_ITEM)
                                .label(p.getSchemaName() != null ? p.getSchemaName() : p.getPageTitle())
                                .type(resourceTypeOf(p))
                                .externalIri(iri)
                                .metadata(new LinkedHashMap<>())
                                .build());
                    }
                    edges.add(GraphEdgeDto.builder()
                            .sourceId(item.getId().toString())
                            .targetId(resolvedTarget)
                            .kind(GraphEdgeKind.GRAPH_USES)
                            .label("kasutab")
                            .build());
                }
            }
        } else {
            List<GraphLinkedPageDto> children = oppekavaGraphService.getOnOsaChildren(pageTitle);
            addLinkedNeighbours(item, children, GraphEdgeKind.GRAPH_CONSISTS_OF, "onOsa",
                    item.getType().name().toLowerCase(), nodes, edges, graphItemIris, ownIriIndex);
        }
    }

    private void addScalarEdge(CurriculumItem source,
                               String targetIri,
                               String targetLabel,
                               String targetType,
                               GraphEdgeKind edgeKind,
                               String edgeLabel,
                               List<GraphNodeDto> nodes,
                               List<GraphEdgeDto> edges,
                               Set<String> graphItemIris,
                               Map<String, String> ownIriIndex) {
        if (targetIri == null || targetIri.isBlank()) return;
        String resolvedTarget = ownIriIndex.getOrDefault(targetIri, targetIri);
        if (!ownIriIndex.containsKey(targetIri) && graphItemIris.add(targetIri)) {
            nodes.add(GraphNodeDto.builder()
                    .id(targetIri)
                    .kind(GraphNodeKind.GRAPH_ITEM)
                    .label(targetLabel != null && !targetLabel.isBlank() ? targetLabel : targetIri)
                    .type(targetType)
                    .externalIri(targetIri)
                    .metadata(new LinkedHashMap<>())
                    .build());
        }
        edges.add(GraphEdgeDto.builder()
                .sourceId(source.getId().toString())
                .targetId(resolvedTarget)
                .kind(edgeKind)
                .label(edgeLabel)
                .build());
    }

    private static String resolveOwnId(CurriculumItem item, Map<String, GraphNodeDto> ownByIri) {
        if (item == null) return null;
        String iri = item.getExternalIri();
        if (iri != null && !iri.isBlank() && ownByIri.containsKey(iri)) {
            return ownByIri.get(iri).getId();
        }
        return item.getId().toString();
    }

    private static String resourceTypeOf(GraphResourcePageDto p) {
        if (p.getLearningResourceType() != null && !p.getLearningResourceType().isBlank()) {
            return p.getLearningResourceType().toLowerCase();
        }
        return "learning_material";
    }

    private void addLinkedNeighbours(CurriculumItem source,
                                     List<GraphLinkedPageDto> links,
                                     GraphEdgeKind edgeKind,
                                     String edgeLabel,
                                     String nodeType,
                                     List<GraphNodeDto> nodes,
                                     List<GraphEdgeDto> edges,
                                     Set<String> graphItemIris,
                                     Map<String, String> ownIriIndex) {
        if (links == null) return;
        for (GraphLinkedPageDto link : links) {
            String iri = link.getFullUrl();
            if (iri == null || iri.isBlank()) continue;
            String resolvedTarget = ownIriIndex.getOrDefault(iri, iri);
            if (!ownIriIndex.containsKey(iri) && graphItemIris.add(iri)) {
                nodes.add(GraphNodeDto.builder()
                        .id(iri)
                        .kind(GraphNodeKind.GRAPH_ITEM)
                        .label(link.getFulltext())
                        .type(nodeType != null ? nodeType : "learning_outcome")
                        .externalIri(iri)
                        .metadata(new LinkedHashMap<>())
                        .build());
            }
            edges.add(GraphEdgeDto.builder()
                    .sourceId(source.getId().toString())
                    .targetId(resolvedTarget)
                    .kind(edgeKind)
                    .label(edgeLabel)
                    .build());
        }
    }
}
