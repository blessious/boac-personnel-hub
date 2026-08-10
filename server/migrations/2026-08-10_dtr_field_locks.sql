UPDATE dtr_entries
SET am_in_locked = 1,
    am_out_locked = 1,
    pm_in_locked = 1,
    pm_out_locked = 1
WHERE locked = 1
  AND am_in_locked = 0
  AND am_out_locked = 0
  AND pm_in_locked = 0
  AND pm_out_locked = 0;
