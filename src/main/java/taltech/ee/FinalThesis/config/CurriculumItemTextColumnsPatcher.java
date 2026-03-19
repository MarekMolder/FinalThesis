package taltech.ee.FinalThesis.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Hibernate {@code ddl-auto=update} ei laienda PostgreSQL-is sageli olemasolevaid {@code varchar(255)} veerge.
 * Käivitub pärast konteksti värskendust (JPA/Hibernate on juba skeemi uuendanud) ja teeb veergude laiendamise TEXT-iks.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CurriculumItemTextColumnsPatcher {

    private final DataSource dataSource;

    private static final String[] CURRICULUM_ITEM_TEXT_COLUMNS = {
            "title",
            "external_iri",
            "local_key",
            "subject_iri",
            "subject_area_iri",
            "subject_label",
            "subject_area_label",
            "topic_label",
            "topic_iri",
            "verb_label",
            "education_level_iri",
            "education_level_label",
            "school_level",
            "grade",
            "notation",
            "verb_iri"
    };

    private volatile boolean patched;

    @EventListener(ContextRefreshedEvent.class)
    @Order(Ordered.LOWEST_PRECEDENCE)
    public void onContextRefreshed(ContextRefreshedEvent event) {
        if (event.getApplicationContext().getParent() != null) {
            return;
        }
        if (patched) {
            return;
        }
        synchronized (this) {
            if (patched) {
                return;
            }
            runPatch();
            patched = true;
        }
    }

    private void runPatch() {
        try (Connection conn = dataSource.getConnection()) {
            if (!conn.getMetaData().getDatabaseProductName().toLowerCase().contains("postgres")) {
                return;
            }
            try (Statement st = conn.createStatement()) {
                for (String col : CURRICULUM_ITEM_TEXT_COLUMNS) {
                    alterToText(st, "curriculum_item", col);
                }
                alterToText(st, "curriculum_item_relation", "target_external_iri");
            }
        } catch (SQLException e) {
            log.warn("Could not widen text columns (DB may be unavailable or schema missing): {}", e.getMessage());
        }
    }

    private static void alterToText(Statement st, String table, String column) {
        String sql = "ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT";
        try {
            st.execute(sql);
            log.info("DB patch: {}.{} -> TEXT", table, column);
        } catch (SQLException e) {
            log.debug("DB patch skipped for {}.{}: {}", table, column, e.getMessage());
        }
    }
}
