package taltech.ee.FinalThesis.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumItemSchedule;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.repositories.CurriculumItemRepository;
import taltech.ee.FinalThesis.repositories.CurriculumItemScheduleRepository;
import taltech.ee.FinalThesis.repositories.CurriculumVersionRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiContextBuilder {

    private final CurriculumVersionRepository versionRepository;
    private final CurriculumItemRepository itemRepository;
    private final CurriculumItemScheduleRepository scheduleRepository;
    private final OppekavaGraphService graphService;

    private static final String[] STEP_LABELS = {"", "Metaandmed", "Struktuur", "Sisu", "Ajakava"};

    public String buildContext(UUID versionId, int step) {
        Optional<CurriculumVersion> versionOpt = versionRepository.findById(versionId);
        if (versionOpt.isEmpty()) {
            return "Oppekava versiooni ei leitud.";
        }

        CurriculumVersion version = versionOpt.get();
        Curriculum curriculum = version.getCurriculum();
        List<CurriculumItem> items = itemRepository.findAllWithParentByCurriculumVersion_Id(versionId);

        StringBuilder sb = new StringBuilder();

        // Header
        String stepLabel = (step >= 1 && step <= 4) ? STEP_LABELS[step] : "?";
        sb.append("Oppekava: ").append(curriculum.getSubjectIri())
          .append(" · ").append(curriculum.getGrade())
          .append(" · ").append(curriculum.getSchoolLevel()).append("\n");
        sb.append("Praegune samm: ").append(step).append(" (").append(stepLabel).append(")\n");

        if (curriculum.getVolumeHours() != null && curriculum.getVolumeHours() > 0) {
            sb.append("Kogu maht: ").append(curriculum.getVolumeHours()).append(" tundi\n");
        }
        sb.append("\n");

        // Tree structure
        if (!items.isEmpty()) {
            sb.append("Puu struktuur:\n");
            Map<UUID, List<CurriculumItem>> childrenMap = items.stream()
                .filter(i -> i.getParentItem() != null)
                .collect(Collectors.groupingBy(i -> i.getParentItem().getId()));

            List<CurriculumItem> roots = items.stream()
                .filter(i -> i.getParentItem() == null)
                .sorted(Comparator.comparingInt(CurriculumItem::getOrderIndex))
                .toList();

            for (CurriculumItem root : roots) {
                appendTreeNode(sb, root, childrenMap, 0);
            }
            sb.append("\n");
        }

        // Graph comparison — missing items
        try {
            Map<String, Object> graphData = graphService.findItemsByMetadata(
                curriculum.getSubjectIri(),
                curriculum.getSchoolLevel(),
                curriculum.getSubjectAreaIri(),
                curriculum.getGrade(),
                curriculum.getEducationalLevelIri()
            );

            Set<String> existingTitles = items.stream()
                .map(CurriculumItem::getTitle)
                .collect(Collectors.toSet());
            Set<String> existingIris = items.stream()
                .map(CurriculumItem::getExternalIri)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            List<String> missing = new ArrayList<>();
            addMissingFromGraphList(graphData.get("modules"), existingTitles, existingIris, "MODULE", missing);

            // Show themes with their LO counts from graph
            if (graphData.get("themes") instanceof List<?> themesList) {
                for (Object t : themesList) {
                    if (t instanceof Map<?, ?> themeMap) {
                        String title = (String) themeMap.get("title");
                        String fullUrl = (String) themeMap.get("fullUrl");
                        if (title == null) continue;
                        boolean alreadyAdded = existingTitles.contains(title)
                            || (fullUrl != null && existingIris.contains(fullUrl));

                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> themeLos = (List<Map<String, Object>>) themeMap.get("learningOutcomes");
                        int loCount = themeLos != null ? themeLos.size() : 0;
                        int missingLoCount = 0;

                        if (themeLos != null) {
                            for (Map<String, Object> lo : themeLos) {
                                String loTitle = (String) lo.get("title");
                                String loUrl = (String) lo.get("fullUrl");
                                boolean loAdded = (loTitle != null && existingTitles.contains(loTitle))
                                    || (loUrl != null && existingIris.contains(loUrl));
                                if (!loAdded) {
                                    missingLoCount++;
                                    String entry = "[LEARNING_OUTCOME] " + loTitle;
                                    if (loUrl != null && !loUrl.isBlank()) {
                                        entry += " (iri: " + loUrl + ")";
                                    }
                                    missing.add(entry);
                                }
                            }
                        }

                        if (!alreadyAdded) {
                            String entry = "[TOPIC] " + title + " (" + loCount + " opivaljundit graafis";
                            if (missingLoCount > 0) {
                                entry += ", " + missingLoCount + " lisamata";
                            }
                            entry += ")";
                            if (fullUrl != null && !fullUrl.isBlank()) {
                                entry += " (iri: " + fullUrl + ")";
                            }
                            missing.add(entry);
                        }
                    }
                }
            }

            if (!missing.isEmpty()) {
                sb.append("Graafist saadaval aga lisamata:\n");
                for (String m : missing) {
                    sb.append("- ").append(m).append("\n");
                }
                sb.append("\n");
            }
        } catch (Exception e) {
            log.warn("Failed to load graph data for AI context: {}", e.getMessage());
        }

        // Schedule info for step 4
        if (step == 4) {
            List<CurriculumItemSchedule> schedules = scheduleRepository
                .findByCurriculumItem_CurriculumVersion_Id(versionId);
            Set<UUID> scheduledItemIds = schedules.stream()
                .map(s -> s.getCurriculumItem().getId())
                .collect(Collectors.toSet());
            long total = items.size();
            long scheduled = items.stream().filter(i -> scheduledItemIds.contains(i.getId())).count();
            sb.append("Ajakava: ").append(scheduled).append("/").append(total)
              .append(" elemendil on ajakava maaratud\n");

            List<String> unscheduled = items.stream()
                .filter(i -> !scheduledItemIds.contains(i.getId()))
                .filter(i -> List.of("TOPIC", "MODULE").contains(i.getType().name()))
                .map(i -> "[" + i.getType() + "] " + i.getTitle())
                .toList();
            if (!unscheduled.isEmpty()) {
                sb.append("Ajastamata elemendid:\n");
                for (String u : unscheduled) {
                    sb.append("- ").append(u).append("\n");
                }
            }
        }

        return sb.toString();
    }

    private void appendTreeNode(StringBuilder sb, CurriculumItem item,
                                 Map<UUID, List<CurriculumItem>> childrenMap, int depth) {
        sb.append("  ".repeat(depth))
          .append("- [").append(item.getType()).append("] ").append(item.getTitle());

        List<CurriculumItem> children = childrenMap.getOrDefault(item.getId(), List.of());
        if (!children.isEmpty()) {
            sb.append(" (").append(children.size()).append(" last-elementi)");
        }
        sb.append("\n");

        children.stream()
            .sorted(Comparator.comparingInt(CurriculumItem::getOrderIndex))
            .forEach(child -> appendTreeNode(sb, child, childrenMap, depth + 1));
    }

    @SuppressWarnings("unchecked")
    private void addMissingFromGraphList(Object graphList, Set<String> existingTitles,
                                          Set<String> existingIris, String type, List<String> missing) {
        if (graphList == null) return;
        if (graphList instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    String title = (String) map.get("title");
                    String fullUrl = (String) map.get("fullUrl");
                    if (title == null) continue;
                    boolean alreadyAdded = existingTitles.contains(title)
                        || (fullUrl != null && existingIris.contains(fullUrl));
                    if (!alreadyAdded) {
                        String entry = "[" + type + "] " + title;
                        if (fullUrl != null && !fullUrl.isBlank()) {
                            entry += " (iri: " + fullUrl + ")";
                        }
                        missing.add(entry);
                    }
                }
            }
        }
    }
}
