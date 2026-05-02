package taltech.ee.FinalThesis.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Retroactively fills {@code curriculum_item.local_key} on items that have neither an
 * {@code external_iri} nor a {@code local_key}. Without a stable key, the version diff
 * service cannot match items across versions duplicated from a common source — they fall
 * back to per-item synthetic keys and surface as bogus ADDED+REMOVED pairs.
 * <p>
 * Strategy: items with the same {@code (curriculum_id, type, title)} get the same
 * generated key. This makes copies of the same logical item — across all versions of a
 * single curriculum — share a key. Trade-off: two genuinely-distinct items with
 * identical title + type within one curriculum would collide; in practice this is rare
 * and acceptable for backfilling pre-existing data.
 * <p>
 * Runs once at startup, after schema migration.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CurriculumItemLocalKeyBackfiller {

    private final DataSource dataSource;

    private volatile boolean ran;

    @EventListener(ContextRefreshedEvent.class)
    @Order(Ordered.LOWEST_PRECEDENCE)
    public void onContextRefreshed(ContextRefreshedEvent event) {
        if (event.getApplicationContext().getParent() != null) return;
        if (ran) return;
        synchronized (this) {
            if (ran) return;
            run();
            ran = true;
        }
    }

    private void run() {
        try (Connection conn = dataSource.getConnection()) {
            if (!conn.getMetaData().getDatabaseProductName().toLowerCase().contains("postgres")) {
                return;
            }
            int updated = backfill(conn);
            if (updated > 0) {
                log.info("Backfilled local_key on {} curriculum_item rows", updated);
            }
        } catch (SQLException e) {
            log.warn("Could not backfill local_key (DB may be unavailable or schema missing): {}", e.getMessage());
        }
    }

    private int backfill(Connection conn) throws SQLException {
        String selectSql =
                "SELECT id, curriculum_version_id, type, title " +
                "FROM curriculum_item " +
                "WHERE (local_key IS NULL OR local_key = '') " +
                "  AND (external_iri IS NULL OR external_iri = '')";
        String curriculumIdSql =
                "SELECT curriculum_id FROM curriculum_version WHERE id = ?";
        String updateSql =
                "UPDATE curriculum_item SET local_key = ? WHERE id = ?";

        int updated = 0;
        try (Statement select = conn.createStatement();
             ResultSet rs = select.executeQuery(selectSql);
             PreparedStatement curriculumLookup = conn.prepareStatement(curriculumIdSql);
             PreparedStatement update = conn.prepareStatement(updateSql)) {

            while (rs.next()) {
                String itemId = rs.getString("id");
                String versionId = rs.getString("curriculum_version_id");
                String type = rs.getString("type");
                String title = rs.getString("title");

                String curriculumId = lookupCurriculumId(curriculumLookup, versionId);
                if (curriculumId == null) continue;

                String key = "auto:" + sha1(curriculumId + "|" + nullSafe(type) + "|" + nullSafe(title));
                update.setString(1, key);
                update.setString(2, itemId);
                update.executeUpdate();
                updated++;
            }
        }
        return updated;
    }

    private static String lookupCurriculumId(PreparedStatement ps, String versionId) throws SQLException {
        ps.setString(1, versionId);
        try (ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getString(1) : null;
        }
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static String sha1(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 unavailable", e);
        }
    }
}
