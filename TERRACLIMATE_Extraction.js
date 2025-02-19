/**  
 * =============================================================  
 * TerraClimate Monthly and Annual Precipitation & PET Extraction for Gheba Basin  
 * =============================================================  
 * Author: HUNDESA SIRAJ MOHAMMED  
 * Student at University of Padua  
 * Department of Water and Geological Risk Engineering  
 *  
 * Thesis Title:  
 * "Basin-scale hydrological impacts from climatic changes:  
 *  a model assessment in the Horn of Africa"  
 *  
 * Description:  
 * Extracts monthly and annual precipitation and potential evapotranspiration (PET) data  
 * from the TerraClimate dataset for the Gheba Basin from 1999-2019. Computes total annual  
 * precipitation and PET, and exports monthly precipitation and PET as CSV files for further analysis.  
 *  
 * Dataset Used: IDAHO_EPSCOR/TERRACLIMATE  
 *  
 * Outputs:  
 * - CSV file of monthly precipitation values  
 * - CSV file of monthly PET values  
 * - GeoTIFF file of the average annual precipitation  
 * - GeoTIFF file of the average annual PET  
 */

// ===================== //
// 1. DEFINE REGION OF INTEREST (ROI) //
// ===================== //
// Replace 'roi' with your coordinates or shapefile for the Gheba Basin
// var roi = /* Define your ROI here */;

// ===================== //
// 2. LOAD TERRACLIMATE DATASET //
// ===================== //
// Define the time range
var startYear = 1999;
var endYear = 2019;

// Load the TerraClimate dataset and select precipitation ('pr') and PET ('pet') bands
var terraclimate = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
  .select(['pr', 'pet'])
  .filterDate(ee.Date.fromYMD(startYear, 1, 1), ee.Date.fromYMD(endYear, 12, 31))
  .filterBounds(roi);

// ===================== //
// 3. EXPORT MONTHLY PRECIPITATION & PET TO CSV //
// ===================== //
var monthlyData = terraclimate.map(function(image) {
  var date = image.date().format('YYYY-MM'); // Monthly format
  var meanPrecip = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 4638.3, // Native TerraClimate resolution
    maxPixels: 1e13
  }).get('pr');
  
  var meanPET = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 4638.3,
    maxPixels: 1e13
  }).get('pet');
  
  return ee.Feature(null, {
    'datetime': date,
    'TERRACLIMATE_PRECIPITATION': meanPrecip,
    'TERRACLIMATE_PET': meanPET
  });
});

Export.table.toDrive({
  collection: ee.FeatureCollection(monthlyData),
  description: 'Tigray_TerraClimate_Monthly_Precipitation_PET_1999_2019',
  fileFormat: 'CSV'
});

// ===================== //
// 4. EXPORT ANNUAL AVERAGE PRECIPITATION & PET AS GEOTIFF //
// ===================== //
var annualData = ee.ImageCollection(
  ee.List.sequence(startYear, endYear).map(function(year) {
    var yearlyData = terraclimate
      .filter(ee.Filter.calendarRange(year, year, 'year'))
      .sum()
      .set('year', year);
    return yearlyData;
  })
);

var annualBands = annualData.toBands();
var averageAnnualData = annualBands.reduce(ee.Reducer.mean());

// Export the GeoTIFF file for precipitation
Export.image.toDrive({
  image: averageAnnualData.select('pr_mean').clip(roi),
  description: 'Tigray_Average_Annual_Precipitation_1999_2019',
  scale: 4638.3,
  region: roi,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});

// Export the GeoTIFF file for PET
Export.image.toDrive({
  image: averageAnnualData.select('pet_mean').clip(roi),
  description: 'Tigray_Average_Annual_PET_1999_2019',
  scale: 4638.3,
  region: roi,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});
