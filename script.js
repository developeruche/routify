// npm i pretty-bytes
import prettyBytes from 'pretty-bytes'


import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import axios from "axios";
import setupEditor from './setupEditor';


const form = document.querySelector('[data-form]')
const queryParamsContainer = document.querySelector('[data-query-params]')
const requestHeadersContainer = document.querySelector('[data-request-header]')
const keyValueTemplate = document.querySelector('[data-key-value-template]')
const responseHeaderContainer = document.querySelector('[data-response-headers]')

queryParamsContainer.append(createKeyValuePair())
requestHeadersContainer.append(createKeyValuePair())


document.querySelector('[data-add-query-param-btn]')
.addEventListener('click', () => {
    queryParamsContainer.append(createKeyValuePair())
})

document.querySelector('[data-add-request-header-btn')
.addEventListener('click', () => {
    requestHeadersContainer.append(createKeyValuePair())
})
 

// Adding custom data to our axios package
axios.interceptors.request.use(request => {
    request.customData = request.customData || {}
    request.customData.startTime = new Date().getTime()
    return request
})

function updateEndTime(response) {
    response.customData = response.customData || {}
    response.customData.time = new Date().getTime() - response.config.customData.startTime
    return response
}
axios.interceptors.response.use(updateEndTime, e => {
    return Promise.reject(updateEndTime(e.response))
})

const { requestEditor, updateResponseEditor } = setupEditor()

// Submit form
form.addEventListener('submit', e => {
    e.preventDefault()

    let data
    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null)
    } catch (e) {
        alert('JSON data error...')
        return
    }


    axios({ 
        url: document.querySelector('[data-url]').value,
        method: document.querySelector('[data-method]').value,
        params: keyValuePairsToObjects(queryParamsContainer),
        headers: keyValuePairsToObjects(requestHeadersContainer),
        data
    })
    .catch(err => err)
    .then(data => {
        document.querySelector('[data-response-section]').classList.remove('d-none')
        console.log(data) //for information sake
        updateResponseDetails(data)
        updateResponseEditor(data.data)
        updateResponseHeader(data.headers)
    })
})

function updateResponseDetails(res) {
    document.querySelector('[data-status]').textContent = res.status
    document.querySelector('[data-time]').textContent = res.customData.time
    document.querySelector('[data-size]').textContent = prettyBytes(
        JSON.stringify(res.data).length + JSON.stringify(res.headers).length
    )
}
function updateResponseHeader(headers){
    responseHeaderContainer.innerHtml = ""

    Object.entries(headers).forEach(([key, value]) => {
        const keyElement = document.createElement('div')
        keyElement.textContent = key
        responseHeaderContainer.append(keyElement)

        const valueElement = document.createElement('div')
        valueElement.textContent = value
        responseHeaderContainer.append(valueElement)
    })
}

function createKeyValuePair()  {
    const element = keyValueTemplate.content.cloneNode(true)
    element.querySelector('[data-remove-btn]').addEventListener('click', e => {
        e.target.closest('[data-key-value-pair]').remove() //This would remove the last key value pair
    })
    return element
}

function keyValuePairsToObjects(container){
    const pairs = container.querySelectorAll('[data-key-value-pair]')
    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector('[data-key]').value
        const value = pair.querySelector('[data-value]').value

        if (key === '') return data
        return { ...data, [key]: value}
    }, {})
}