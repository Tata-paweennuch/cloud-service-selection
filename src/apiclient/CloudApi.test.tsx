import { CloudApi, Cloud } from '../apiclient/CloudApi'
import { mockedAxios } from '../setupTests'

const cloudApi = new CloudApi

it('should fetche the cloud data successfully', async () => {
  const mockClouds: Cloud[] = [{
    cloud_description: "Europe, Finland - Google Cloud: Finland",
    cloud_name: "google-europe-north1",
    geo_latitude: 60.5693,
    geo_longitude: 27.1878,
    geo_region: "europe"
  }]
  mockedAxios.get.mockResolvedValue({ data: { clouds: mockClouds } })
  const response = await cloudApi.getCloudList()

  expect(response).toEqual(mockClouds)
  expect(mockedAxios.get).toHaveBeenCalledWith('https://api.aiven.io/v1/clouds')
})

it('fetches data from the API erroneously', async () => {
  const someError = new Error('error message')
  mockedAxios.get.mockRejectedValue(someError)
  
  try {
    await cloudApi.getCloudList()
  } catch(e) {
    expect(e).toEqual(someError)
  }
})
