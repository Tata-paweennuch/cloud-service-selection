// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

import { configure } from 'enzyme'
// https://github.com/enzymejs/enzyme/issues/2429
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'

configure({ adapter: new Adapter() })

import axios from 'axios'
jest.mock("axios")

export const mockedAxios = axios as jest.Mocked<typeof axios>

// https://stackoverflow.com/a/51829561
export const getCurrentPositionMock = jest.fn()
  .mockImplementationOnce((success) => Promise.resolve(success({
    coords: {
      latitude: 51.1,
      longitude: 45.3
    }
  })))
const mockGeolocation = {
  getCurrentPosition: getCurrentPositionMock
}
global.navigator.geolocation = mockGeolocation
