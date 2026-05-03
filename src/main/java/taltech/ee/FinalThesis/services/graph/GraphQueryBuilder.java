package taltech.ee.FinalThesis.services.graph;

/** Builds SMW Ask API query strings. Constants centralized; static factories for parameterized shapes. */
public final class GraphQueryBuilder {

    public static final String CATEGORY_OPPEKAVA = "Category:Haridus:Oppekava";
    public static final String CATEGORY_OPPEKAVA_MOODUL = "Category:Haridus:OppekavaMoodul";
    public static final String CATEGORY_ULESANNE = "Category:Haridus:Ulesanne";
    public static final String CATEGORY_OPPEMATERJAL = "Category:Haridus:Oppematerjal";
    public static final String CATEGORY_KNOBIT = "Category:Haridus:Knobit";

    private static final String CURRICULUM_PRINTOUTS =
            "?Schema:name|?Schema:identifier|?Schema:numberOfCredits|?Schema:provider|?Schema:audience|?Schema:relevantOccupation|?Haridus:seotudMoodul|?Haridus:seotudOpivaljund";

    private static final String LEARNING_OUTCOME_PRINTOUTS =
            "?Schema:name|?Haridus:verb|?Haridus:klass|?Haridus:kooliaste|?Haridus:seotudHaridusaste|?Haridus:seotudOppeaine|?Haridus:seotudAinevaldkond|?Haridus:seotudTeema|?Haridus:seotudMoodul|?Haridus:seotudOppekava|?Haridus:koosneb|?Haridus:eeldab|?Haridus:sisaldabKnobitit|?Haridus:onEelduseks|?Haridus:onOsaks|?Haridus:seotudOpivaljund|?Haridus:semanticRelation|?Skos:semanticRelation|?Kategooria";

    private static final String MODULE_LIST_PRINTOUTS =
            "?Schema:name|?Schema:numberOfCredits|?Haridus:seotudOppekava|?Haridus:eeldus|?Haridus:seotudOpivaljund";

    private static final String CONTENT_ITEM_PRINTOUTS =
            "?Schema:headline|?Schema:url|?Haridus:seotudTeema|limit=100";

    private static final String MATERIAL_ITEM_PRINTOUTS =
            "?Schema:headline|?Schema:url|?Schema:learningResourceType|?Haridus:seotudTeema|limit=100";

    private GraphQueryBuilder() {}

    public static String allCurricula() {
        return "[[" + CATEGORY_OPPEKAVA + "]]|?Schema:name|?Schema:identifier|?Schema:provider";
    }

    public static String curriculumByPageTitle(String pageTitle) {
        return "[[" + pageTitle + "]]|" + CURRICULUM_PRINTOUTS;
    }

    public static String modulesForCurriculum(String curriculumPageTitle) {
        return "[[" + CATEGORY_OPPEKAVA_MOODUL + "]][[Haridus:seotudOppekava::"
                + curriculumPageTitle + "]]|" + MODULE_LIST_PRINTOUTS;
    }

    public static String learningOutcomeByPageTitle(String pageTitle) {
        return "[[" + pageTitle + "]]|" + LEARNING_OUTCOME_PRINTOUTS;
    }

    public static String moduleByPageTitle(String pageTitle) {
        return "[[" + pageTitle + "]]|" + MODULE_LIST_PRINTOUTS;
    }

    public static String contentItem(String category, String linkProperty, String linkTarget, boolean withLearningResourceType) {
        String printouts = withLearningResourceType ? MATERIAL_ITEM_PRINTOUTS : CONTENT_ITEM_PRINTOUTS;
        return "[[" + category + "]][[" + linkProperty + "::" + linkTarget + "]]|" + printouts;
    }

    public static String contentItemInverse(String category, String linkProperty, String linkTarget, boolean withLearningResourceType) {
        String printouts = withLearningResourceType ? MATERIAL_ITEM_PRINTOUTS : CONTENT_ITEM_PRINTOUTS;
        return "[[" + category + "]][[-Haridus:onOsa." + linkProperty + "::" + linkTarget + "]]|" + printouts;
    }

    public static String onOsaChildren(String category, String parentPageTitle) {
        return "[[" + category + "]][[Haridus:onOsa::" + parentPageTitle
                + "]]|?Schema:headline|?Schema:url|limit=100";
    }
}
