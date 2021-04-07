import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import App from './App';
import CloudListCopy from './components/CloudListCopy';

test('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
})

test('should renders Child component', () => {
  const wrapper = shallow(<App />)
  expect(wrapper.containsMatchingElement(<CloudListCopy />)).toEqual(true)
})
