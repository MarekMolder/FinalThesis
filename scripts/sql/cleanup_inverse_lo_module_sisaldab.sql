-- One-off cleanup: removes erroneous LEARNING_OUTCOME -> MODULE SISALDAB rows that duplicate
-- the correct MODULE -> LEARNING_OUTCOME SISALDAB (same version), created by external graph sync
-- before fix in ExternalCurriculumSyncServiceImpl.expandLearningOutcomeSubtree.
--
-- Review with SELECT before DELETE:
--
-- SELECT inv.id, inv.curriculum_version_id, src.type AS src_type, tgt.type AS tgt_type
-- FROM curriculum_item_relation inv
-- JOIN curriculum_item src ON src.id = inv.source_curriculum_item_id
-- JOIN curriculum_item tgt ON tgt.id = inv.target_curriculum_item_id
-- WHERE inv.type = 'SISALDAB'
--   AND src.type = 'LEARNING_OUTCOME'
--   AND tgt.type = 'MODULE'
--   AND EXISTS (
--     SELECT 1 FROM curriculum_item_relation fwd
--     WHERE fwd.curriculum_version_id = inv.curriculum_version_id
--       AND fwd.type = 'SISALDAB'
--       AND fwd.source_curriculum_item_id = inv.target_curriculum_item_id
--       AND fwd.target_curriculum_item_id = inv.source_curriculum_item_id
--   );

DELETE FROM curriculum_item_relation inv
WHERE inv.type = 'SISALDAB'
  AND EXISTS (
    SELECT 1
    FROM curriculum_item src
    WHERE src.id = inv.source_curriculum_item_id
      AND src.type = 'LEARNING_OUTCOME'
  )
  AND EXISTS (
    SELECT 1
    FROM curriculum_item tgt
    WHERE tgt.id = inv.target_curriculum_item_id
      AND tgt.type = 'MODULE'
  )
  AND EXISTS (
    SELECT 1
    FROM curriculum_item_relation fwd
    WHERE fwd.curriculum_version_id = inv.curriculum_version_id
      AND fwd.type = 'SISALDAB'
      AND fwd.source_curriculum_item_id = inv.target_curriculum_item_id
      AND fwd.target_curriculum_item_id = inv.source_curriculum_item_id
  );
