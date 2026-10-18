const supabase = require("../config/supabase");

const LOG_COLUMNS =
  "log_id, user_id, performed_by, action, entity, entity_id, sensor_type, room_name, details, created_at";

const formatDetails = (details) =>
  details
    ? Object.entries(details)
        .map(([key, value]) => `${key}: ${value ?? "—"}`)
        .join(", ")
    : null;

// Records an admin action. Never throws: a failed audit write should not
// fail the request that triggered it.
exports.logAction = async (admin, action, entity, entityId = null, details = null) => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: admin?.id ?? null,
      performed_by: admin?.email ?? null,
      action,
      entity,
      entity_id: entityId == null ? null : String(entityId),
      details: formatDetails(details),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
};

exports.getLogs = async ({ entity, action, limit = 50, offset = 0 } = {}) => {
  let query = supabase
    .from("audit_logs")
    .select(LOG_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (entity) query = query.eq("entity", entity);
  if (action) query = query.eq("action", action);

  const { data, error, count } = await query;

  if (error) throw error;
  return { logs: data, total: count };
};
