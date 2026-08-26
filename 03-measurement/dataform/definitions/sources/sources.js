declare({
  database: "eagames-ebc-demo-app",
  schema: "ea_measurement",
  name: "feature_attribution_shap",
  description: "Raw / pre-computed SHAP feature attribution telemetry table created via BigQuery / Terraform"
});

declare({
  database: "eagames-ebc-demo-app",
  schema: "ea_measurement",
  name: "creative_performance_telemetry",
  description: "Granular marketing campaign telemetry across channels, surfaces, and funnel stages"
});

declare({
  database: "eagames-ebc-demo-app",
  schema: "ea_measurement",
  name: "causal_lift_experiments",
  description: "Geo-matched and holdout randomized causal lift experiments for calibrating Meridian MMM priors"
});
