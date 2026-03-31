package taltech.ee.FinalThesis.services;

import java.util.UUID;

public interface ContentJsonGeneratorService {
    /** Generates content_json for the given version, saves it, and returns the JSON string. */
    String generateAndSave(UUID versionId, UUID userId);
}
