import type { components, operations, paths } from "./noaaWeather";

// ============================================================================
// ALERT TYPES
// ============================================================================

/**
 * An object representing a public alert message from the National Weather Service.
 */
export type Alert = components["schemas"]["Alert"];

/**
 * A collection of alerts in various formats
 */
export type AlertCollection = components["schemas"]["AlertCollection"];
export type AlertCollectionGeoJson =
  components["schemas"]["AlertCollectionGeoJson"];
export type AlertCollectionJsonLd =
  components["schemas"]["AlertCollectionJsonLd"];

/**
 * Individual alert formats
 */
export type AlertGeoJson = components["schemas"]["AlertGeoJson"];
export type AlertJsonLd = components["schemas"]["AlertJsonLd"];
export type AlertCap = components["schemas"]["AlertCap"];
export type AlertAtomFeed = components["schemas"]["AlertAtomFeed"];
export type AlertAtomEntry = components["schemas"]["AlertAtomEntry"];
export type AlertXMLParameter = components["schemas"]["AlertXMLParameter"];

/**
 * Alert identifier
 */
export type AlertId = components["schemas"]["AlertId"];

/**
 * Alert enums and status types
 */
export type AlertCertainty = components["schemas"]["AlertCertainty"];
export type AlertMessageType = components["schemas"]["AlertMessageType"];
export type AlertSeverity = components["schemas"]["AlertSeverity"];
export type AlertStatus = components["schemas"]["AlertStatus"];
export type AlertUrgency = components["schemas"]["AlertUrgency"];

/**
 * Alert categories
 */
export type AlertCategory =
  | "Met"
  | "Geo"
  | "Safety"
  | "Security"
  | "Rescue"
  | "Fire"
  | "Health"
  | "Env"
  | "Transport"
  | "Infra"
  | "CBRNE"
  | "Other";

/**
 * Alert response types
 */
export type AlertResponse =
  | "Shelter"
  | "Evacuate"
  | "Prepare"
  | "Execute"
  | "Avoid"
  | "Monitor"
  | "Assess"
  | "AllClear"
  | "None";

/**
 * Alert scope types
 */
export type AlertScope = "Public" | "Restricted" | "Private";

// ============================================================================
// LOCATION AND ZONE TYPES
// ============================================================================

/**
 * Geographic codes and identifiers
 */
export type AreaCode = components["schemas"]["AreaCode"];
export type StateTerritoryCode = components["schemas"]["StateTerritoryCode"];
export type MarineAreaCode = components["schemas"]["MarineAreaCode"];
export type NWSZoneID = components["schemas"]["NWSZoneID"];
export type NWSZoneType = components["schemas"]["NWSZoneType"];

/**
 * Region codes
 */
export type RegionCode = components["schemas"]["RegionCode"];
export type LandRegionCode = components["schemas"]["LandRegionCode"];
export type MarineRegionCode = components["schemas"]["MarineRegionCode"];

/**
 * Zone types
 */
export type Zone = components["schemas"]["Zone"];
export type ZoneGeoJson = components["schemas"]["ZoneGeoJson"];
export type ZoneJsonLd = components["schemas"]["ZoneJsonLd"];
export type ZoneCollectionGeoJson =
  components["schemas"]["ZoneCollectionGeoJson"];
export type ZoneCollectionJsonLd =
  components["schemas"]["ZoneCollectionJsonLd"];

/**
 * Zone forecast types
 */
export type ZoneForecast = components["schemas"]["ZoneForecast"];
export type ZoneForecastGeoJson = components["schemas"]["ZoneForecastGeoJson"];
export type ZoneForecastJsonLd = components["schemas"]["ZoneForecastJsonLd"];

// ============================================================================
// OFFICE AND ORGANIZATION TYPES
// ============================================================================

/**
 * NWS office identifiers
 */
export type NWSForecastOfficeId = components["schemas"]["NWSForecastOfficeId"];
export type NWSRegionalHQId = components["schemas"]["NWSRegionalHQId"];
export type NWSNationalHQId = components["schemas"]["NWSNationalHQId"];
export type NWSOfficeId = components["schemas"]["NWSOfficeId"];
export type NWSCenterWeatherServiceUnitId =
  components["schemas"]["NWSCenterWeatherServiceUnitId"];
export type ATSUIdentifier = components["schemas"]["ATSUIdentifier"];

/**
 * Office information
 */
export type Office = components["schemas"]["Office"];
export type OfficeHeadline = components["schemas"]["OfficeHeadline"];
export type OfficeHeadlineCollection =
  components["schemas"]["OfficeHeadlineCollection"];
export type CenterWeatherServiceUnitJsonLd =
  components["schemas"]["CenterWeatherServiceUnitJsonLd"];

// ============================================================================
// FORECAST TYPES
// ============================================================================

/**
 * Gridpoint and forecast data
 */
export type Gridpoint = components["schemas"]["Gridpoint"];
export type GridpointGeoJson = components["schemas"]["GridpointGeoJson"];
export type GridpointJsonLd = components["schemas"]["GridpointJsonLd"];
export type GridpointQuantitativeValueLayer =
  components["schemas"]["GridpointQuantitativeValueLayer"];

/**
 * 12-hour forecast types
 */
export type Gridpoint12hForecast =
  components["schemas"]["Gridpoint12hForecast"];
export type Gridpoint12hForecastGeoJson =
  components["schemas"]["Gridpoint12hForecastGeoJson"];
export type Gridpoint12hForecastJsonLd =
  components["schemas"]["Gridpoint12hForecastJsonLd"];
export type Gridpoint12hForecastPeriod =
  components["schemas"]["Gridpoint12hForecastPeriod"];

/**
 * Hourly forecast types
 */
export type GridpointHourlyForecast =
  components["schemas"]["GridpointHourlyForecast"];
export type GridpointHourlyForecastGeoJson =
  components["schemas"]["GridpointHourlyForecastGeoJson"];
export type GridpointHourlyForecastJsonLd =
  components["schemas"]["GridpointHourlyForecastJsonLd"];
export type GridpointHourlyForecastPeriod =
  components["schemas"]["GridpointHourlyForecastPeriod"];

/**
 * Forecast units
 */
export type GridpointForecastUnits =
  components["schemas"]["GridpointForecastUnits"];

// ============================================================================
// OBSERVATION TYPES
// ============================================================================

/**
 * Observation data
 */
export type Observation = components["schemas"]["Observation"];
export type ObservationGeoJson = components["schemas"]["ObservationGeoJson"];
export type ObservationJsonLd = components["schemas"]["ObservationJsonLd"];
export type ObservationCollectionGeoJson =
  components["schemas"]["ObservationCollectionGeoJson"];
export type ObservationCollectionJsonLd =
  components["schemas"]["ObservationCollectionJsonLd"];

/**
 * Observation station types
 */
export type ObservationStation = components["schemas"]["ObservationStation"];
export type ObservationStationGeoJson =
  components["schemas"]["ObservationStationGeoJson"];
export type ObservationStationJsonLd =
  components["schemas"]["ObservationStationJsonLd"];
export type ObservationStationCollectionGeoJson =
  components["schemas"]["ObservationStationCollectionGeoJson"];
export type ObservationStationCollectionJsonLd =
  components["schemas"]["ObservationStationCollectionJsonLd"];

/**
 * METAR-specific types
 */
export type MetarPhenomenon = components["schemas"]["MetarPhenomenon"];
export type MetarSkyCoverage = components["schemas"]["MetarSkyCoverage"];

// ============================================================================
// AVIATION TYPES
// ============================================================================

/**
 * Center Weather Advisory types
 */
export type CenterWeatherAdvisory =
  components["schemas"]["CenterWeatherAdvisory"];
export type CenterWeatherAdvisoryGeoJson =
  components["schemas"]["CenterWeatherAdvisoryGeoJson"];
export type CenterWeatherAdvisoryCollectionGeoJson =
  components["schemas"]["CenterWeatherAdvisoryCollectionGeoJson"];

/**
 * SIGMET types
 */
export type Sigmet = components["schemas"]["Sigmet"];
export type SigmetGeoJson = components["schemas"]["SigmetGeoJson"];
export type SigmetCollectionGeoJson =
  components["schemas"]["SigmetCollectionGeoJson"];
export type SigmetSequenceNumber =
  components["schemas"]["SigmetSequenceNumber"];

// ============================================================================
// TEXT PRODUCT TYPES
// ============================================================================

/**
 * Text products
 */
export type TextProduct = components["schemas"]["TextProduct"];
export type TextProductCollection =
  components["schemas"]["TextProductCollection"];
export type TextProductTypeCollection =
  components["schemas"]["TextProductTypeCollection"];
export type TextProductLocationCollection =
  components["schemas"]["TextProductLocationCollection"];

// ============================================================================
// POINT AND GEOMETRY TYPES
// ============================================================================

/**
 * Point metadata
 */
export type Point = components["schemas"]["Point"];
export type PointGeoJson = components["schemas"]["PointGeoJson"];
export type PointJsonLd = components["schemas"]["PointJsonLd"];
export type PointString = components["schemas"]["PointString"];

/**
 * Relative location
 */
export type RelativeLocation = components["schemas"]["RelativeLocation"];
export type RelativeLocationGeoJson =
  components["schemas"]["RelativeLocationGeoJson"];
export type RelativeLocationJsonLd =
  components["schemas"]["RelativeLocationJsonLd"];

// ============================================================================
// GEOJSON TYPES
// ============================================================================

/**
 * GeoJSON geometry types
 */
export type GeoJsonBoundingBox = components["schemas"]["GeoJsonBoundingBox"];
export type GeoJsonCoordinate = components["schemas"]["GeoJsonCoordinate"];
export type GeoJsonGeometry = components["schemas"]["GeoJsonGeometry"];
export type GeoJsonFeature = components["schemas"]["GeoJsonFeature"];
export type GeoJsonFeatureCollection =
  components["schemas"]["GeoJsonFeatureCollection"];
export type GeoJsonLineString = components["schemas"]["GeoJsonLineString"];
export type GeoJsonPolygon = components["schemas"]["GeoJsonPolygon"];
export type GeometryString = components["schemas"]["GeometryString"];

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Measurement and units
 */
export type QuantitativeValue = components["schemas"]["QuantitativeValue"];
export type UnitOfMeasure = components["schemas"]["UnitOfMeasure"];

/**
 * Time and date formats
 */
export type Date = components["schemas"]["Date"];
export type Time = components["schemas"]["Time"];
export type ISO8601Duration = components["schemas"]["ISO8601Duration"];
export type ISO8601Interval = components["schemas"]["ISO8601Interval"];

/**
 * Pagination and collections
 */
export type PaginationInfo = components["schemas"]["PaginationInfo"];
export type JsonLdContext = components["schemas"]["JsonLdContext"];

/**
 * Error handling
 */
export type ProblemDetail = components["schemas"]["ProblemDetail"];

/**
 * File types
 */
export type BinaryFile = components["schemas"]["BinaryFile"];

// ============================================================================
// OPERATION TYPES (API ENDPOINTS)
// ============================================================================

/**
 * Alert operations
 */
export type AlertsQueryOperation = operations["alerts_query"];
export type AlertsActiveOperation = operations["alerts_active"];
export type AlertsActiveCountOperation = operations["alerts_active_count"];
export type AlertsActiveZoneOperation = operations["alerts_active_zone"];
export type AlertsActiveAreaOperation = operations["alerts_active_area"];
export type AlertsActiveRegionOperation = operations["alerts_active_region"];

/**
 * Alert query parameters
 */
export type AlertsQueryParams =
  operations["alerts_query"]["parameters"]["query"];
export type AlertsActiveParams =
  operations["alerts_active"]["parameters"]["query"];

/**
 * Forecast operations
 */
export type GridpointForecastOperation = operations["gridpoint_forecast"];
export type GridpointForecastHourlyOperation =
  operations["gridpoint_forecast_hourly"];
export type GridpointOperation = operations["gridpoint"];

/**
 * Observation operations
 */
export type StationObservationListOperation =
  operations["station_observation_list"];
export type StationObservationLatestOperation =
  operations["station_observation_latest"];
export type StationObservationTimeOperation =
  operations["station_observation_time"];

/**
 * Zone operations
 */
export type ZoneListOperation = operations["zone_list"];
export type ZoneOperation = operations["zone"];
export type ZoneForecastOperation = operations["zone_forecast"];

/**
 * Point operation
 */
export type PointOperation = operations["point"];

// ============================================================================
// PARAMETER TYPES
// ============================================================================

/**
 * Common parameters
 */
export type AlertAreaParam = components["parameters"]["AlertArea"];
export type AlertCertaintyParam = components["parameters"]["AlertCertainty"];
export type AlertCodeParam = components["parameters"]["AlertCode"];
export type AlertEventNameParam = components["parameters"]["AlertEventName"];
export type AlertMessageTypeParam =
  components["parameters"]["AlertMessageType"];
export type AlertPointParam = components["parameters"]["AlertPoint"];
export type AlertRegionParam = components["parameters"]["AlertRegion"];
export type AlertRegionTypeParam = components["parameters"]["AlertRegionType"];
export type AlertSeverityParam = components["parameters"]["AlertSeverity"];
export type AlertStatusParam = components["parameters"]["AlertStatus"];
export type AlertUrgencyParam = components["parameters"]["AlertUrgency"];
export type AlertZoneParam = components["parameters"]["AlertZone"];

/**
 * Gridpoint parameters
 */
export type GridpointWFOParam = components["parameters"]["GridpointWFO"];
export type GridpointXParam = components["parameters"]["GridpointX"];
export type GridpointYParam = components["parameters"]["GridpointY"];
export type GridpointForecastUnitsParam =
  components["parameters"]["GridpointForecastUnits"];
export type GridpointForecastFeatureFlagsParam =
  components["parameters"]["GridpointForecastFeatureFlags"];

/**
 * Location parameters
 */
export type LatitudeParam = components["parameters"]["Latitude"];
export type LongitudeParam = components["parameters"]["Longitude"];

/**
 * Pagination parameters
 */
export type LimitParam = components["parameters"]["Limit"];
export type PaginationCursorParam =
  components["parameters"]["PaginationCursor"];

/**
 * Time parameters
 */
export type DateParam = components["parameters"]["Date"];
export type TimeParam = components["parameters"]["Time"];
export type QueryDateParam = components["parameters"]["QueryDate"];
export type QueryStartTimeParam = components["parameters"]["QueryStartTime"];
export type QueryEndTimeParam = components["parameters"]["QueryEndTime"];

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * API response types
 */
export type AlertCollectionResponse =
  components["responses"]["AlertCollection"];
export type ErrorResponse = components["responses"]["Error"];
export type Gridpoint12hForecastResponse =
  components["responses"]["Gridpoint12hForecast"];
export type GridpointHourlyForecastResponse =
  components["responses"]["GridpointHourlyForecast"];
export type ObservationResponse = components["responses"]["Observation"];
export type ObservationCollectionResponse =
  components["responses"]["ObservationCollection"];
export type ObservationStationCollectionResponse =
  components["responses"]["ObservationStationCollection"];

// ============================================================================
// HEADER TYPES
// ============================================================================

/**
 * API headers
 */
export type CorrelationIdHeader = components["headers"]["CorrelationId"];
export type RequestIdHeader = components["headers"]["RequestId"];
export type ServerIdHeader = components["headers"]["ServerId"];
export type ApiKeyHeader = components["headers"]["X-Api-Key"];

// ============================================================================
// PATH TYPES
// ============================================================================

/**
 * API paths (for reference)
 */
export type ApiPaths = paths;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Temperature trend direction
 */
export type TemperatureTrend = "rising" | "falling" | null;

/**
 * Wind direction (16-point compass)
 */
export type WindDirection =
  | "N"
  | "NNE"
  | "NE"
  | "ENE"
  | "E"
  | "ESE"
  | "SE"
  | "SSE"
  | "S"
  | "SSW"
  | "SW"
  | "WSW"
  | "W"
  | "WNW"
  | "NW"
  | "NNW";

/**
 * Temperature unit
 */
export type TemperatureUnit = "F" | "C";

/**
 * Weather coverage
 */
export type WeatherCoverage =
  | "areas"
  | "brief"
  | "chance"
  | "definite"
  | "few"
  | "frequent"
  | "intermittent"
  | "isolated"
  | "likely"
  | "numerous"
  | "occasional"
  | "patchy"
  | "periods"
  | "scattered"
  | "slight_chance"
  | "widespread"
  | null;

/**
 * Weather type
 */
export type WeatherType =
  | "blowing_dust"
  | "blowing_sand"
  | "blowing_snow"
  | "drizzle"
  | "fog"
  | "freezing_fog"
  | "freezing_drizzle"
  | "freezing_rain"
  | "freezing_spray"
  | "frost"
  | "hail"
  | "haze"
  | "ice_crystals"
  | "ice_fog"
  | "rain"
  | "rain_showers"
  | "sleet"
  | "smoke"
  | "snow"
  | "snow_showers"
  | "thunderstorms"
  | "volcanic_ash"
  | "water_spouts"
  | null;

/**
 * Weather intensity
 */
export type WeatherIntensity =
  | "very_light"
  | "light"
  | "moderate"
  | "heavy"
  | null;

/**
 * Hazard attributes
 */
export type HazardAttribute =
  | "damaging_wind"
  | "dry_thunderstorms"
  | "flooding"
  | "gusty_wind"
  | "heavy_rain"
  | "large_hail"
  | "small_hail"
  | "tornadoes";

/**
 * Quality control flag from MADIS system
 */
export type QualityControlFlag =
  | "Z"
  | "C"
  | "S"
  | "V"
  | "X"
  | "Q"
  | "G"
  | "B"
  | "T";
