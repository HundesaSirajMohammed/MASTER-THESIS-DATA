/**  
 * =============================================================  
 * ERA5-Land Hourly Precipitation Extraction for Gheba Basin  
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
 * Extracts hourly total precipitation data from the ERA5-Land dataset  
 * for the Gheba Basin from 1999-2002. The extracted data is processed  
 * to compute mean precipitation per hour and total precipitation over  
 * the entire period. The results are exported as CSV and GeoTIFF files.  
 *  
 * Dataset Used: ECMWF ERA5-LAND HOURLY Precipitation Dataset  
 *  
 * Outputs:  
 * - CSV file containing hourly precipitation values  
 * - GeoTIFF file of the average precipitation  
 */

// Define Region of Interest (ROI)
var roi = /* Define your ROI here */;

// Load ERA5-Land dataset
var era5land = ee.ImageCollection('ECMWF/ERA5_LAND/HOURLY')
                .filterBounds(roi)
                .filterDate('1999-01-01', '2002-12-31')
                .select('total_precipitation_hourly');

// Compute hourly mean precipitation
var precipHourly = era5land.map(function(image) {
    var mean = image.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: roi,
        scale: 11132,
        maxPixels: 1e13
    }).get('total_precipitation_hourly');
    
    return ee.Feature(null, {
        'datetime': image.date().format('YYYY-MM-dd HH:mm:ss'),
        'ERA5_PRECIPITATION': mean
    });
});

// Export data as CSV
Export.table.toDrive({
    collection: ee.FeatureCollection(precipHourly),
    description: 'Gheba_ERA5_Hourly_Precipitation_1999_2002',
    fileFormat: 'CSV'
});

// Compute total precipitation over time
var totalPrecip = era5land.sum().clip(roi);
var nHours = ee.Date('2002-12-31T23:00:00').difference(ee.Date('1999-01-01T00:00:00'), 'hour');
var avgPrecip = totalPrecip.divide(nHours);

// Export average precipitation as GeoTIFF
Export.image.toDrive({
    image: avgPrecip,
    description: 'ERA5-LAND_Average_Hourly_Precipitation_1999_2002',
    scale: 11132,
    region: roi,
    fileFormat: 'GeoTIFF'
});
