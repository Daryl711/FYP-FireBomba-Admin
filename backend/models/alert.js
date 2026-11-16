const supabase = require("../config/supabase");

// Alerts are written to alert_notifications by the user app's backend when a
// room's sensors detect fire. is_read on that table is the admin's own
// acknowledged flag; each resident's read state lives in user_notifications.

exports.getAllAlerts = async () => {
  const { data, error } = await supabase
    .from("alert_notifications")
    .select(
      "alert_id, room_id, timestamp, warning_title, is_read, room:room_id (name, bilik(bilik_number))",
    )
    .order("timestamp", { ascending: false });

  if (error) throw error;

  return data.map(({ room, ...alert }) => ({
    ...alert,
    room_name: room?.name ?? null,
    bilik_number: room?.bilik?.bilik_number ?? null,
  }));
};

// Flips the admin's acknowledged flag. Returns the number of alerts changed.
exports.acknowledgeAlert = async (alertId) => {
  const { data: alert, error: readError } = await supabase
    .from("alert_notifications")
    .select("is_read")
    .eq("alert_id", alertId)
    .maybeSingle();

  if (readError) throw readError;
  if (!alert) return 0;

  const { data, error } = await supabase
    .from("alert_notifications")
    .update({ is_read: !alert.is_read })
    .eq("alert_id", alertId)
    .select("alert_id");

  if (error) throw error;
  return data.length;
};

// Removes the alert for everyone (user_notifications rows cascade).
exports.deleteAlert = async (alertId) => {
  const { data, error } = await supabase
    .from("alert_notifications")
    .delete()
    .eq("alert_id", alertId)
    .select("alert_id");

  if (error) throw error;
  return data.length;
};
