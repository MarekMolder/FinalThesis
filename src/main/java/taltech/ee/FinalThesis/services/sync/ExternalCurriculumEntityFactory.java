package taltech.ee.FinalThesis.services.sync;

import org.springframework.stereotype.Component;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumDetailDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphCurriculumSummaryDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphLearningOutcomeDto;
import taltech.ee.FinalThesis.domain.dto.graph.GraphModuleDto;
import taltech.ee.FinalThesis.domain.entities.Curriculum;
import taltech.ee.FinalThesis.domain.entities.CurriculumItem;
import taltech.ee.FinalThesis.domain.entities.CurriculumVersion;
import taltech.ee.FinalThesis.domain.enums.CurriculumEducationalFrameworkEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemSourceTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumItemTypeEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionPublishStatusEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVersionStateEnum;
import taltech.ee.FinalThesis.domain.enums.CurriculumVisbilityEnum;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure factory: converts graph DTOs → JPA entities. No services injected.
 */
@Component
public class ExternalCurriculumEntityFactory {

    private static final String EXTERNAL_SOURCE = "oppekava.edu.ee";
    private static final String EMPTY_JSON = "{}";
    private static final String CURRICULUM_TYPE = "external";
    private static final int EAP_HOURS = 26;
    private static final String EXTERNAL_LEVEL = "Haridus:external";

    public Curriculum buildCurriculum(GraphCurriculumSummaryDto dto, GraphCurriculumDetailDto detail) {
        String title = dto.getName() != null && !dto.getName().isBlank()
                ? dto.getName()
                : (dto.getPageTitle() != null ? dto.getPageTitle() : "External curriculum");
        String provider = dto.getProvider() != null && !dto.getProvider().isBlank()
                ? dto.getProvider()
                : "";
        String audience = "";
        String audienceIri = null;
        String relevantOccupation = "";
        String relevantOccupationIri = null;
        int volumeHours = 0;
        if (detail != null) {
            if (detail.getAudience() != null && !detail.getAudience().isBlank()) audience = detail.getAudience();
            audienceIri = detail.getAudienceIri();
            if (detail.getRelevantOccupation() != null && !detail.getRelevantOccupation().isBlank()) {
                relevantOccupation = detail.getRelevantOccupation();
            }
            relevantOccupationIri = detail.getRelevantOccupationIri();
            if (detail.getNumberOfCredits() != null && detail.getNumberOfCredits() > 0) {
                volumeHours = detail.getNumberOfCredits() * EAP_HOURS;
            }
        }

        Curriculum c = new Curriculum();
        c.setTitle(title);
        c.setDescription("");
        c.setCurriculumType(CURRICULUM_TYPE);
        c.setStatus(CurriculumStatusEnum.ACTIVE);
        c.setVisibility(CurriculumVisbilityEnum.PUBLIC);
        c.setProvider(provider);
        c.setRelevantOccupation(relevantOccupation);
        c.setRelevantOccupationIri(relevantOccupationIri);
        c.setIdentifier(dto.getIdentifier() != null ? dto.getIdentifier() : "");
        c.setAudience(audience);
        c.setAudienceIri(audienceIri);
        c.setSubjectAreaIri(EXTERNAL_LEVEL);
        c.setSubjectIri(EXTERNAL_LEVEL);
        c.setEducationalLevelIri(EXTERNAL_LEVEL);
        c.setSchoolLevel("");
        c.setGrade("");
        c.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        c.setLanguage("et");
        c.setVolumeHours(volumeHours);
        c.setExternalSource(EXTERNAL_SOURCE);
        c.setExternalPageIri(dto.getFullUrl());
        c.setExternalGraph(true);
        c.setUser(null);
        c.setCurriculumVersions(new ArrayList<>());
        return c;
    }

    public CurriculumVersion buildVersion(Curriculum curriculum, String externalPageIri) {
        CurriculumVersion v = new CurriculumVersion();
        v.setVersionNumber(1);
        v.setState(CurriculumVersionStateEnum.ARCHIVED);
        v.setChangeNote("Imported from oppekava.edu.ee");
        v.setContentJson(EMPTY_JSON);
        v.setRetrievalContextJson(EMPTY_JSON);
        v.setRetrievedCatalogJson(EMPTY_JSON);
        v.setComplianceReportJson(EMPTY_JSON);
        v.setExternalPageIri(externalPageIri);
        v.setStatus(CurriculumVersionPublishStatusEnum.NOT_PUBLISHED);
        v.setPublishedError("");
        v.setCurriculum(curriculum);
        v.setUser(null);
        v.setCurriculumItems(new ArrayList<>());
        return v;
    }

    public CurriculumItem buildModuleItem(CurriculumVersion version, GraphModuleDto mod, int orderIndex) {
        String displayTitle = mod.getSchemaName() != null && !mod.getSchemaName().isBlank()
                ? mod.getSchemaName()
                : (mod.getTitle() != null ? mod.getTitle() : "Moodul");
        String modUrl = mod.getFullUrl();
        String notation = mod.getNumberOfCredits() != null ? mod.getNumberOfCredits() + " EAP" : "";

        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(CurriculumItemTypeEnum.MODULE);
        item.setTitle(displayTitle);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(modUrl);
        item.setLocalKey(null);
        item.setSubjectIri(null);
        item.setSubjectLabel(null);
        item.setSubjectAreaIri(null);
        item.setSubjectAreaLabel(null);
        item.setTopicLabel(null);
        item.setTopicIri(null);
        item.setVerbLabel(null);
        item.setEducationLevelLabel(null);
        item.setEducationLevelIri(EXTERNAL_LEVEL);
        item.setSchoolLevel("");
        item.setGrade("");
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation(notation);
        item.setVerbIri("");
        item.setIsMandatory(false);
        item.setParentItem(null);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

    public CurriculumItem buildLearningOutcomeItem(CurriculumVersion version, GraphLearningOutcomeDto lo,
                                                   CurriculumItem parent, int orderIndex) {
        String title = lo.getTitle() != null && !lo.getTitle().isBlank() ? lo.getTitle() : "Õpiväljund";
        String externalIri = lo.getFullUrl();
        String grade = lo.getGradeJoined() != null ? lo.getGradeJoined() : "";
        String school = lo.getSchoolLevelJoined() != null ? lo.getSchoolLevelJoined() : "";
        String eduIri = lo.getEducationLevelIri();
        if (eduIri == null || eduIri.isBlank()) {
            eduIri = EXTERNAL_LEVEL;
        }
        String verbIri = lo.getVerbIri() != null ? lo.getVerbIri() : "";
        String notation = lo.getSemanticRelationsJoined() != null ? lo.getSemanticRelationsJoined() : "";

        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(CurriculumItemTypeEnum.LEARNING_OUTCOME);
        item.setTitle(title);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(externalIri);
        item.setLocalKey(null);
        item.setSubjectIri(lo.getSubjectIri());
        item.setSubjectLabel(lo.getSubjectLabel());
        item.setSubjectAreaIri(lo.getSubjectAreaIri());
        item.setSubjectAreaLabel(lo.getSubjectAreaLabel());
        item.setTopicLabel(lo.getTopicLabel());
        item.setTopicIri(lo.getTopicIri());
        item.setVerbLabel(lo.getVerbLabel());
        item.setEducationLevelLabel(lo.getEducationLevelLabel());
        item.setEducationLevelIri(eduIri);
        item.setSchoolLevel(school);
        item.setGrade(grade);
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation(notation);
        item.setVerbIri(verbIri);
        item.setIsMandatory(false);
        item.setParentItem(parent);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

    public CurriculumItem buildMinimalItem(CurriculumVersion version, CurriculumItemTypeEnum type, String title,
                                           String externalIri, CurriculumItem parent, int orderIndex) {
        CurriculumItem item = new CurriculumItem();
        item.setCurriculumVersion(version);
        item.setType(type);
        item.setTitle(title);
        item.setDescription(null);
        item.setOrderIndex(orderIndex);
        item.setSourceType(CurriculumItemSourceTypeEnum.EXTERNAL);
        item.setExternalIri(externalIri);
        item.setLocalKey(null);
        item.setSubjectIri(null);
        item.setSubjectLabel(null);
        item.setSubjectAreaIri(null);
        item.setSubjectAreaLabel(null);
        item.setTopicLabel(null);
        item.setTopicIri(null);
        item.setVerbLabel(null);
        item.setEducationLevelLabel(null);
        item.setEducationLevelIri(EXTERNAL_LEVEL);
        item.setSchoolLevel("");
        item.setGrade("");
        item.setEducationalFramework(CurriculumEducationalFrameworkEnum.ESTONIAN_NATIONAL_CURRICULUM);
        item.setNotation("");
        item.setVerbIri("");
        item.setIsMandatory(false);
        item.setParentItem(parent);
        item.setUser(null);
        item.setCurriculumItemSchedules(new ArrayList<>());
        item.setCurriculumItemRelations(new ArrayList<>());
        return item;
    }

}
