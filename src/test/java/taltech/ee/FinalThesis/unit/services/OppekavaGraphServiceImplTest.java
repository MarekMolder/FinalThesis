package taltech.ee.FinalThesis.unit.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import taltech.ee.FinalThesis.clients.OppekavaGraphClient;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.services.impl.OppekavaGraphServiceImpl;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class OppekavaGraphServiceImplTest {

    @Mock OppekavaGraphClient graphClient;

    @InjectMocks OppekavaGraphServiceImpl service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void listCurriculaFromGraph_buildsExpectedQuery_andMapsResults() throws Exception {
        String json = "{\"results\":{"
                + "\"Curriculum One\":{"
                + "\"fullurl\":\"https://oppekava.edu.ee/curriculum-one\","
                + "\"printouts\":{"
                + "\"Schema:name\":[\"Curriculum One\"],"
                + "\"Schema:identifier\":[\"C1\"],"
                + "\"Schema:provider\":[\"TalTech\"]"
                + "}}}}";
        JsonNode response = objectMapper.readTree(json);
        when(graphClient.ask(org.mockito.ArgumentMatchers.anyString())).thenReturn(response);

        List<GraphCurriculumSummaryDto> result = service.listCurriculaFromGraph();

        // Verify the query construction (uses Category:Haridus:Oppekava)
        ArgumentCaptor<String> queryCaptor = ArgumentCaptor.forClass(String.class);
        verify(graphClient).ask(queryCaptor.capture());
        String issuedQuery = queryCaptor.getValue();
        assertThat(issuedQuery).contains("Category:Haridus:Oppekava");
        assertThat(issuedQuery).contains("?Schema:name");
        assertThat(issuedQuery).contains("?Schema:identifier");
        assertThat(issuedQuery).contains("?Schema:provider");

        // Verify mapping
        assertThat(result).hasSize(1);
        GraphCurriculumSummaryDto dto = result.get(0);
        assertThat(dto.getPageTitle()).isEqualTo("Curriculum One");
        assertThat(dto.getFullUrl()).isEqualTo("https://oppekava.edu.ee/curriculum-one");
        assertThat(dto.getName()).isEqualTo("Curriculum One");
        assertThat(dto.getIdentifier()).isEqualTo("C1");
        assertThat(dto.getProvider()).isEqualTo("TalTech");
    }

    @Test
    void getLearningOutcomeFromGraph_mapsRowToDto_withSchemaNameAndKlass() throws Exception {
        String json = "{\"results\":{"
                + "\"LO Page\":{"
                + "\"fullurl\":\"https://oppekava.edu.ee/lo-page\","
                + "\"printouts\":{"
                + "\"Schema:name\":[\"Õpiväljund A\"],"
                + "\"Haridus:klass\":[\"8. klass\",\"9. klass\"],"
                + "\"Haridus:kooliaste\":[\"III kooliaste\"],"
                + "\"Haridus:verb\":[{\"fulltext\":\"selgitab\",\"fullurl\":\"https://oppekava.edu.ee/verb\"}]"
                + "}}}}";
        JsonNode response = objectMapper.readTree(json);
        when(graphClient.ask(org.mockito.ArgumentMatchers.anyString())).thenReturn(response);

        GraphLearningOutcomeDto dto = service.getLearningOutcomeFromGraph("LO Page");

        ArgumentCaptor<String> queryCaptor = ArgumentCaptor.forClass(String.class);
        verify(graphClient).ask(queryCaptor.capture());
        assertThat(queryCaptor.getValue()).contains("[[LO Page]]");
        assertThat(queryCaptor.getValue()).contains("?Schema:name");
        assertThat(queryCaptor.getValue()).contains("?Haridus:verb");

        assertThat(dto.getPageTitle()).isEqualTo("LO Page");
        assertThat(dto.getFullUrl()).isEqualTo("https://oppekava.edu.ee/lo-page");
        assertThat(dto.getTitle()).isEqualTo("Õpiväljund A");
        assertThat(dto.getSchemaName()).isEqualTo("Õpiväljund A");
        assertThat(dto.getGradeJoined()).contains("8. klass").contains("9. klass");
        assertThat(dto.getSchoolLevelJoined()).isEqualTo("III kooliaste");
        assertThat(dto.getVerbLabel()).isEqualTo("selgitab");
        assertThat(dto.getVerbIri()).isEqualTo("https://oppekava.edu.ee/verb");
    }

    @Test
    void getLearningOutcomeFromGraph_throwsWhenPageTitleBlank() {
        assertThatThrownBy(() -> service.getLearningOutcomeFromGraph(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pageTitle is required");
    }
}
