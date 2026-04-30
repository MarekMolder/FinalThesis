package taltech.ee.FinalThesis.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiActionDto {
    private String type;        // ADD_ITEM, IMPORT_GRAPH_ITEM, ADD_SCHEDULE
    private String label;       // Display title
    private String description; // Short description
    private String itemType;    // MODULE, TOPIC, LEARNING_OUTCOME, TASK, TEST, LEARNING_MATERIAL, KNOBIT
    private String parentTitle; // For ADD_ITEM / IMPORT_GRAPH_ITEM: parent element name
    private String externalIri; // For IMPORT_GRAPH_ITEM: graph IRI
    private String targetTitle; // For ADD_SCHEDULE: element to schedule
    private Integer hours;      // For ADD_SCHEDULE: suggested hours
}
