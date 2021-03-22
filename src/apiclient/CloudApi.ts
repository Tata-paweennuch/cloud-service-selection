import { AxiosResponse } from 'axios'
import axios from 'axios';

export interface Cloud {
  cloud_description: string,
  cloud_name: string,
  geo_latitude: number,
  geo_longitude: number,
  geo_region: string,
  distance?: number  // added when calculating distance between 2 plaes
}

export class CloudApi {
  // making this to be a method because .....
  private getBaseUrl(): string {
    return 'https://api.aiven.io/v1/clouds'
  }

  public async getCloudList(): Promise<Cloud[]> {
    const url = this.getBaseUrl()

    const response: AxiosResponse = await axios.get(url)
    return response?.data.clouds || []
  }
}
