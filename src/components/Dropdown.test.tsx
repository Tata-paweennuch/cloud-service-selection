import { shallow } from 'enzyme';
import Dropdown from './Dropdown';
import renderer from 'react-test-renderer'

let wrapper: any
let action: any
let options: any

beforeEach(() => {
  action = jest.fn()
  options = [
    { value: 'may', displayName: 'May' },
    { value: 'june', displayName: 'June' }
  ]
  wrapper = shallow(<Dropdown label="Please select" id="month" value="April" handleOnChange={action} options={options}  />)
})

afterEach(() => {
  if(wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  action.mockClear()
})

test('should render correctly with options', async () => {
  const tree = renderer.create(<Dropdown label="Please select" id="month" value="April" handleOnChange={action} options={options}/>)
  expect(tree.toJSON()).toMatchSnapshot()
})

test('should display select and option elements with value correctly', () => {
  expect(wrapper.find('.dropdown').exists()).toBeTruthy
  expect(wrapper.find('label').text()).toEqual('Please select')
  expect(wrapper.find('label').props()['htmlFor']).toEqual('month')
  expect(wrapper.find('select').props()['name']).toEqual('month')
  expect(wrapper.find('select').props()['id']).toEqual('month')
  expect(wrapper.find('select').props()['value']).toEqual('April')
  // has 2 options
  expect(wrapper.find('option').length).toEqual(2)
  expect(wrapper.find('option').at(0).text()).toEqual(options[0].displayName)
  expect(wrapper.find('option').at(0).props()['value']).toEqual(options[0].value)
  expect(wrapper.find('option').at(1).text()).toEqual(options[1].displayName)
  expect(wrapper.find('option').at(1).props()['value']).toEqual(options[1].value)
})

test('should call handleOnChange props with correct argument when selecting an option', () => {
  wrapper.find('select').simulate('change', {
    target: { value: 'april' }
  })

  expect(action).toHaveBeenCalledTimes(1)
  expect(action).toHaveBeenLastCalledWith('april')
})
