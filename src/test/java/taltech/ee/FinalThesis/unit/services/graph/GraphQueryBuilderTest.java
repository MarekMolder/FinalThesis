package taltech.ee.FinalThesis.unit.services.graph;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import taltech.ee.FinalThesis.services.graph.GraphQueryBuilder;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("unit")
class GraphQueryBuilderTest {

    @Test
    void allCurricula_buildsExpectedQuery() {
        String q = GraphQueryBuilder.allCurricula();
        assertThat(q).contains("[[Category:Haridus:Oppekava]]");
        assertThat(q).contains("?Schema:name");
        assertThat(q).contains("?Schema:identifier");
        assertThat(q).contains("?Schema:provider");
    }

    @Test
    void curriculumByPageTitle_includesCurriculumPrintouts() {
        String q = GraphQueryBuilder.curriculumByPageTitle("Some Page");
        assertThat(q).startsWith("[[Some Page]]");
        assertThat(q).contains("?Schema:numberOfCredits");
        assertThat(q).contains("?Haridus:seotudMoodul");
    }

    @Test
    void modulesForCurriculum_targetsCorrectCategoryAndLink() {
        String q = GraphQueryBuilder.modulesForCurriculum("Curr X");
        assertThat(q).contains("[[Category:Haridus:OppekavaMoodul]]");
        assertThat(q).contains("[[Haridus:seotudOppekava::Curr X]]");
    }

    @Test
    void learningOutcomeByPageTitle_includesLearningOutcomePrintouts() {
        String q = GraphQueryBuilder.learningOutcomeByPageTitle("LO 1");
        assertThat(q).startsWith("[[LO 1]]");
        assertThat(q).contains("?Haridus:verb");
        assertThat(q).contains("?Haridus:klass");
        assertThat(q).contains("?Haridus:kooliaste");
    }

    @Test
    void contentItem_byCategoryAndLink_buildsExpected() {
        String q = GraphQueryBuilder.contentItem(
                "Category:Haridus:Ulesanne",
                "Haridus:seotudOpivaljund",
                "LO Page",
                false);
        assertThat(q).contains("[[Category:Haridus:Ulesanne]]");
        assertThat(q).contains("[[Haridus:seotudOpivaljund::LO Page]]");
        assertThat(q).contains("?Schema:headline");
        assertThat(q).contains("limit=100");
        assertThat(q).doesNotContain("?Schema:learningResourceType");
    }

    @Test
    void contentItem_withMaterialFlag_includesLearningResourceType() {
        String q = GraphQueryBuilder.contentItem(
                "Category:Haridus:Oppematerjal",
                "Haridus:seotudOpivaljund",
                "LO Page",
                true);
        assertThat(q).contains("?Schema:learningResourceType");
    }
}
