export class CloudApi {
  public async getCloudList() {
    return [
      {
        cloud_description: "Europe, Finland - Google Cloud: Finland",
        cloud_name: "google-europe-north1",
        geo_latitude: 60.5693,
        geo_longitude: 27.1878,
        geo_region: "europe"
      },
      {
        cloud_description: "Asia, Japan - Azure: Japan East",
        cloud_name: "azure-japaneast",
        geo_latitude: 35.68,
        geo_longitude: 139.68,
        geo_region: "east asia"
      },
      {
        cloud_description: "United States, California - Amazon Web Services: N. California",
        cloud_name: "aws-us-west-1",
        geo_latitude: 37.78,
        geo_longitude: -122.42,
        geo_region: "north america"
      }
    ]
  }
}
