import { shallow } from 'enzyme';
import CloudList, { emptyOption } from './CloudList';
import { CloudApi, Cloud } from '../apiclient/CloudApi'
import * as helper from '../helper/DistanceCalculation'
import Dropdown from './Dropdown'
import { getCurrentPositionMock } from '../setupTests'
import renderer from 'react-test-renderer'

let wrapper: any

const mockClouds = [
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

// has a same cloud name in 2 object(google)
const mockClouds2 = [
  ...mockClouds,
  {
    cloud_description: "Canada, Quebec - Google Cloud: Montréal",
    cloud_name: "google-northamerica-northeast1",
    geo_latitude: 45.5,
    geo_longitude: -73.57,
    geo_region: "north america"
  }
]

// use the mock class instead of the real one
jest.mock('../apiclient/CloudApi');

afterEach(() => {
  if(wrapper) {
    wrapper.unmount()
    wrapper = null
  }
})

test('should render correctly when isLoading is true', async () => {
  const component = shallow<CloudList>(<CloudList />)
  await component.instance().componentDidMount()
  component.setState({
    isLoading: true
  })

  const tree = renderer.create(component.getElement()).toJSON()
  expect(tree).toMatchSnapshot()
})

test('should render correctly with cloud selection', async () => {
  const tree = renderer.create(<CloudList />)
  await CloudApi.prototype.getCloudList()
  expect(tree.toJSON()).toMatchSnapshot()
})

test('should have correct default state properties', () => {
  const wrapper = shallow(<CloudList />, { disableLifecycleMethods: true })
  expect(wrapper.state('isLoading')).toBeFalsy()
  expect(wrapper.state('clouds')).toEqual([])
  expect(wrapper.state('cloudNameOptions')).toEqual([emptyOption])
  expect(wrapper.state('regionOptions')).toEqual([emptyOption])
  expect(wrapper.state('selectedCloud')).toEqual('')
  expect(wrapper.state('selectedRegion')).toEqual('')
  expect(wrapper.state('selectedCity')).toEqual('')
  expect(wrapper.state('filteredItems')).toEqual([])
  expect(wrapper.state('location')).toEqual({ lat: 60.1699, lon: 24.9384 })
})

test('should fetch cloud data during componentDidMount hook', async () => {
  wrapper = shallow(<CloudList />)
  const apiCallSpy = jest.spyOn(CloudApi.prototype, 'getCloudList')
  wrapper.instance().setCloudOptions = jest.fn()
  wrapper.instance().setRegionOptions = jest.fn()
  wrapper.instance().filterCloudByNameAndOrRegion = jest.fn()
  wrapper.instance().forceUpdate()
  await wrapper.instance().componentDidMount()

  expect(CloudApi.prototype.getCloudList).toHaveBeenCalled()
  expect(apiCallSpy).toHaveBeenCalled()
  expect(wrapper.instance().setCloudOptions).toHaveBeenCalled()
  expect(wrapper.instance().setRegionOptions).toHaveBeenCalled()
  expect(wrapper.instance().filterCloudByNameAndOrRegion).toHaveBeenCalled()
  expect(wrapper.state('clouds')).toEqual(mockClouds)
  expect(getCurrentPositionMock).toHaveBeenCalled()

  apiCallSpy.mockReset()
  apiCallSpy.mockRestore()
})

test('should show loading text when isLoading state is true', () => {
  wrapper = shallow(<CloudList />)
  wrapper.setState({ isLoading: true })

  expect(wrapper.find('.content-wrapper').text()).toContain('Loading')
})

test('should render Child components', async() => {
  wrapper = shallow(<CloudList />)
  await wrapper.instance().componentDidMount()
  expect(wrapper.find(Dropdown).length).toEqual(2)

  const cloudSelection = wrapper.find(Dropdown).at(0)
  const expectedCloudOptions = [
    { value: 'google', displayName: 'Google Cloud' },
    { value: 'azure', displayName: 'Microsoft Azure' },
    { value: 'aws', displayName: 'Amazon Web Services' }
  ]
  expect(cloudSelection.props()['label']).toEqual('Select cloud')
  expect(cloudSelection.props()['id']).toEqual('cloud')
  expect(cloudSelection.props()['value']).toEqual('')
  expect(cloudSelection.props()['handleOnChange']).toEqual(wrapper.instance().handleCloudNameChange)
  expect(cloudSelection.props()['options']).toEqual([emptyOption, ...expectedCloudOptions])

  const regionSelection = wrapper.find(Dropdown).at(1)
  // since region options based on select cloud name which we set default to mockClouds[0].name(google)
  const expectedRegionOptions = [
    { value: mockClouds[0].geo_region, displayName: 'Europe' },
    { value: mockClouds[1].geo_region, displayName: 'East Asia' },
    { value: mockClouds[2].geo_region, displayName: 'North America' }
  ]
  expect(regionSelection.props()['label']).toEqual('Select region')
  expect(regionSelection.props()['id']).toEqual('region')
  expect(regionSelection.props()['value']).toEqual('')
  expect(regionSelection.props()['handleOnChange']).toEqual(wrapper.instance().handleRegionChange)
  expect(regionSelection.props()['options']).toEqual([emptyOption, ...expectedRegionOptions])
})

test('should display the city selector correctly', async () => {
  wrapper = shallow(<CloudList />)
  await wrapper.instance().componentDidMount()
  wrapper.setState({ filteredItems: mockClouds })

  expect(wrapper.find('.dropdown label').text()).toEqual('Select city(Listed from nearest to farest)')
  expect(wrapper.find('.dropdown label').props()['htmlFor']).toEqual('city')
  expect(wrapper.find('.dropdown select').props()['name']).toEqual('city')
  expect(wrapper.find('.dropdown select').props()['id']).toEqual('city')
  expect(wrapper.find('.dropdown select').props()['onChange']).toEqual(wrapper.instance().handleCityChange)
  expect(wrapper.find('.dropdown select').props()['value']).toEqual(wrapper.state('selectedCity'))
  // has 3 options
  expect(wrapper.find('.dropdown select option').length).toEqual(3)
  expect(wrapper.find('.dropdown select option').at(0).text()).toEqual(mockClouds[0].cloud_description + ' * Nearest')
  expect(wrapper.find('.dropdown select option').at(0).props()['value']).toEqual(mockClouds[0].cloud_description)
  expect(wrapper.find('.dropdown select option').at(1).text()).toEqual(mockClouds[1].cloud_description)
  expect(wrapper.find('.dropdown select option').at(1).props()['value']).toEqual(mockClouds[1].cloud_description)
  expect(wrapper.find('.dropdown select option').at(2).text()).toEqual(mockClouds[2].cloud_description)
  expect(wrapper.find('.dropdown select option').at(2).props()['value']).toEqual(mockClouds[2].cloud_description)
})

describe('Filter methods', () => {
  test('should filter cloud list by cloud name', () => {
    wrapper = shallow(<CloudList />)
    wrapper.setState({
      clouds: mockClouds
    })
    const expectedResult = [{
      cloud_description: "United States, California - Amazon Web Services: N. California",
      cloud_name: "aws-us-west-1",
      geo_latitude: 37.78,
      geo_longitude: -122.42,
      geo_region: "north america"
    }]
  
    expect(wrapper.instance().filterCloudsByName('aws')).toEqual(expectedResult)
    expect(wrapper.instance().filterCloudsByName('something')).toEqual([])
  })
  
  test('should filter cloud list by region', () => {
    wrapper = shallow(<CloudList />)
    const expectedResult = [{
      cloud_description: "Asia, Japan - Azure: Japan East",
      cloud_name: "azure-japaneast",
      geo_latitude: 35.68,
      geo_longitude: 139.68,
      geo_region: "east asia"
    }]
  
    expect(wrapper.instance().filterCloudByRegion('east asia', mockClouds)).toEqual(expectedResult)
    expect(wrapper.instance().filterCloudByRegion('invalid region', mockClouds)).toEqual([])
  })
  
  test('should filter cloud list by cloud name and region and set filteredItems state', () => {
    wrapper = shallow(<CloudList />)
    wrapper.setState({
      clouds: mockClouds,
      selectedCloud: 'aws',
      selectedRegion: 'north america'
    })
  
    // searching with valid cloud name and region
    const expectedResult = [{
      cloud_description: "United States, California - Amazon Web Services: N. California",
      cloud_name: "aws-us-west-1",
      geo_latitude: 37.78,
      geo_longitude: -122.42,
      geo_region: "north america"
    }]
  
    wrapper.instance().filterCloudByNameAndOrRegion()
    expect(wrapper.state('filteredItems')).toEqual(expectedResult)
  
    // searching with only valid cloud name
    wrapper.setState({
      clouds: mockClouds,
      selectedCloud: 'aws',
      selectedRegion: ''
    })
    wrapper.instance().filterCloudByNameAndOrRegion()
    expect(wrapper.state('filteredItems')).toEqual(expectedResult)
  
    // searching with valid cloud name and invalid region
    wrapper.setState({
      clouds: mockClouds,
      selectedCloud: 'aws',
      selectedRegion: 'invalid region'
    })
    wrapper.instance().filterCloudByNameAndOrRegion()
    expect(wrapper.state('filteredItems')).toEqual([])
  
    // searching with invalid cloud name and region
    wrapper.setState({
      clouds: mockClouds,
      selectedCloud: 'noname',
      selectedRegion: 'invalid region'
    })
    wrapper.instance().filterCloudByNameAndOrRegion()
    expect(wrapper.state('filteredItems')).toEqual([])  
  })
  
  test('should get a correct full name based on the passed value', () => {
    wrapper = shallow(<CloudList />)
  
    expect(wrapper.instance().getCloudFullName('aws')).toEqual('Amazon Web Services')
    expect(wrapper.instance().getCloudFullName('azure')).toEqual('Microsoft Azure')
    expect(wrapper.instance().getCloudFullName('google')).toEqual('Google Cloud')
    expect(wrapper.instance().getCloudFullName('do')).toEqual('DigitalOcean')
    expect(wrapper.instance().getCloudFullName('upcloud')).toEqual('UpCloud')
    expect(wrapper.instance().getCloudFullName('unmatchedname')).toEqual('unmatchedname')
  })
})

describe('Populate the cloud options', () => {
  test('should set cloudNameOptions state value with correct formatted data when setCloudOptions method is called and cloud list has more than 0 item', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    wrapper.setState({ clouds: mockClouds2 })
    wrapper.instance().forceUpdate()

    const expectedFormat = [
      { value: 'google' , displayName: 'Google Cloud' },
      { value: 'azure' , displayName: 'Microsoft Azure' },
      { value: 'aws' , displayName: 'Amazon Web Services' }
    ]
    
    wrapper.instance().setCloudOptions()
    expect(wrapper.state('cloudNameOptions')).toEqual([emptyOption, ...expectedFormat])
  })

  test('should set cloudNameOptions state value with empty formatted data when setCloudOptions method is called and cloud list has 0 item', () => {
    wrapper = shallow(<CloudList />)
    wrapper.setState({ clouds: [] })
    wrapper.instance().forceUpdate()
    
    wrapper.instance().setCloudOptions()
    expect(wrapper.state('cloudNameOptions')).toEqual([emptyOption])
  })
})

describe('Populate the region options', () => {
  test('should set regionOptions state value with correct formatted data when setRegionOptions method is called and cloud list has more than 0 item', () => {
    wrapper = shallow(<CloudList />)
    wrapper.setState({ clouds: mockClouds2 })
    wrapper.instance().forceUpdate()

    const expectedFormat = [
      { value: mockClouds[0].geo_region, displayName: 'Europe' },
      { value: mockClouds[1].geo_region, displayName: 'East Asia' },
      { value: mockClouds[2].geo_region, displayName: 'North America' }  
    ]
    
    wrapper.instance().setRegionOptions()
    expect(wrapper.state('regionOptions')).toEqual([emptyOption, ...expectedFormat])
  })

  test('should set regionOptions state value with empty formatted data when setRegionOptions method is called and cloud list has 0 item', () => {
    wrapper = shallow(<CloudList />)
    wrapper.setState({ clouds: [] })
    wrapper.instance().forceUpdate()
    
    wrapper.instance().setRegionOptions()
    expect(wrapper.state('regionOptions')).toEqual([emptyOption])
  })
})

describe('handle change methods', () => {
  test('should update the selectedCloud state when handleCloudNameChange method is called', () => {
    wrapper = shallow(<CloudList />)
    wrapper.instance().handleCloudNameChange('aws')

    expect(wrapper.state('selectedCloud')).toEqual('aws')
  })

  test('should update the selectedRegion state when handleRegionChange method is called', () => {
    wrapper = shallow(<CloudList />)
    wrapper.instance().handleRegionChange('region')

    expect(wrapper.state('selectedRegion')).toEqual('region')
  })

  test('should update the selectedCity state correctly', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    const citySelect = wrapper.find('select#city')
    citySelect.simulate('change', { target: { value: 'city' } })

    expect(wrapper.state('selectedCity')).toEqual('city')
  })

  test('should call handleCityChange method when selecting a city option', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    wrapper.instance().handleCityChange = jest.fn()
    wrapper.instance().forceUpdate()
    const citySelect = wrapper.find('select#city')
    citySelect.simulate('change', { target: { value: 'city' } })

    expect(wrapper.instance().handleCityChange).toHaveBeenCalledTimes(1)
  })
})

describe('distance calculation', () => {
  test('should call getDistanceFromLatLonInKm helper function when calculateDistances method is called and filteredItems state has more than 1 item in array', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    const calDistanceSpy = jest.spyOn(helper, 'getDistanceFromLatLonInKm')
    wrapper.setState({ filteredItems: mockClouds })
    wrapper.instance().calculateDistances()

    expect(calDistanceSpy).toHaveBeenCalled()
    calDistanceSpy.mockRestore()
  })

  test('should not call getDistanceFromLatLonInKm helper function when calculateDistances method is called and filteredItems state has 1 item in array', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    const calDistanceSpy = jest.spyOn(helper, 'getDistanceFromLatLonInKm')
    wrapper.setState({ filteredItems: [mockClouds[0]] })
    wrapper.instance().calculateDistances()

    expect(calDistanceSpy).not.toHaveBeenCalled()
    calDistanceSpy.mockRestore()
  })

  test('should add distance propert to the returned cloud list if filteredItems state\'s length is more than 1 when calculateDistances method is called', async () => {
    wrapper = shallow(<CloudList />)
    await wrapper.instance().componentDidMount()
    wrapper.setState({ filteredItems: mockClouds })
    const result = wrapper.instance().calculateDistances()

    result.forEach((item: Cloud) =>{
      expect(item).toHaveProperty('distance')
    })
  })

  test('should sort the cloud list by distance in ascending order when calling sortDistanceAscen method with cloud list length is longer than 1', () => {
    wrapper = shallow(<CloudList />)
    const mockDistances = [
      {
        cloud_name: "google-europe-north1",
        distance: 100
      },
      {
        cloud_name: "azure-japaneast",
        distance: 1
      },
      {
        cloud_name: "aws-us-west-1",
        distance: 10
      }
    ]
    wrapper.instance().calculateDistances = jest.fn().mockReturnValue(mockDistances)
    wrapper.instance().forceUpdate()

    const expectedResult = [
      {
        cloud_name: "azure-japaneast",
        distance: 1
      },
      {
        cloud_name: "aws-us-west-1",
        distance: 10
      },
      {
        cloud_name: "google-europe-north1",
        distance: 100
      }
    ]

    wrapper.instance().sortDistanceAscen()
    expect(wrapper.state('filteredItems')).toEqual(expectedResult)
  })

  test('should just return the same cloud list when calling sortDistanceAscen method with cloud list length is 1', () => {
    wrapper = shallow(<CloudList />)
    const mockDistance = [{ cloud_name: "azure-japaneast", distance: 10000 }]
    wrapper.instance().calculateDistances = jest.fn().mockReturnValue(mockDistance)
    wrapper.instance().forceUpdate()

    wrapper.instance().sortDistanceAscen()
    expect(wrapper.state('filteredItems')).toEqual(mockDistance)
  })
})
