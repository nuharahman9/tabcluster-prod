importScripts('./pyodide/xhrshim.js')
self.XMLHttpRequest = self.XMLHttpRequestShim 
importScripts('./pyodide/pyodide.js')

let tabcluster_pkg = chrome.runtime.getURL('./pyodide/tabcluster-0.1.0-py3-none-any.whl'); 
const js_wheel = chrome.runtime.getURL('./pyodide/js-1.0-py3-none-any.whl'); 
const pathlib = chrome.runtime.getURL('./pyodide/pathlib-1.0.1-py3-none-any.whl')
const punkt_zip_wheel = chrome.runtime.getURL('./pyodide/punkt.zip'); 
console.log("punkt zip: ", punkt_zip_wheel)
let modifyData;
let micropip; 
let pyodide;
loadPyodide({}).then((_pyodide) => {
    pyodide = _pyodide;
    console.log("pyodide loaded\n")
});


// ========================== pyodide ==========================


function rearrangeTabsv2(tabGroups) {
    for (const [key, value] of tabGroups.entries()) { 
        let tabIds = value
        console.log(tabIds)
        if (tabIds.length) { 
            chrome.tabs.group({ tabIds: tabIds }, groupId => {}) 
        }
    }

 }




// call cluster by url 
function groupByDomain(tabs) { 
    let domain_tabIds = {}
    for (let tab of tabs) { 
        let url = tab.url 
        var pathArr = url.split('/')
        var host = pathArr[2]
        if (domain_tabIds[host]) {
            let curr = domain_tabIds[host]
            curr.push(tab.id)
            domain_tabIds[host] = curr
        } else { 
            domain_tabIds[host] = [tab.id]
        }
    }

    console.log("groupbyDomain: ", domain_tabIds)

    rearrangeTabsv2(domain_tabIds)
}



// call cluster method using NMF 
async function cluster(numWindows) { 
    // change this to just be a python object? 
    const data = JSON.stringify({ numWindows: numWindows }); 
    const res = await websiteTopicModel.cluster(data)
    console.log(res)
    topic_map = res.toJs() 
    console.log("to_js(): ", topic_map)
    console.log(typeof topic_map)
    rearrangeTabsv2(topic_map)

}


async function sendTextv2(tabs) { 
    const response = fetch('http://127.0.0.1:5000/upload-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tabs: tabs })
      })
      .catch(error => { 
          console.error("[sendTextv2] something went wrong: ", error)
      });
      
    return response; 
      
}



async function sendTextv3(tabs) { 
    await pyodide.loadPackage("micropip"); 
    const micropip = pyodide.pyimport("micropip"); 
    await micropip.install(js_wheel)
    await micropip.install(pathlib)

    await micropip.install(tabcluster_pkg)
    websiteTopicModel = pyodide.pyimport("websiteTopicModel"); 

    const dater = JSON.stringify({ punkturl: punkt_zip_wheel })
    await websiteTopicModel.init_punkt(dater)

    await websiteTopicModel.upload_text(JSON.stringify(tabs))

    const data = JSON.stringify({ numWindows: -1 }); 
    const res = await websiteTopicModel.cluster(data)
    console.log(res)
    topic_map = res.toJs() 
    console.log("to_js(): ", topic_map)
    console.log(typeof topic_map)
    for (const [key, value] of topic_map.entries()) { 
        console.log(key, value)
    }
    // topic_map = JSON.parse(res)
    // console.log(re)
    re.destroy(); 
    res.destroy(); 
    re.destroy()

}





// communication with popup script 
chrome.runtime.onMessage.addListener(async (data, sender, sendResponse) => {

    if (data.message == "sendText") { 
        const tabs = data.tabs; 
        const len = data.length; 
        console.log("tabs: ", tabs); 
        const numWindows = data.numWindows
        const response = await sendTextv3(tabs); 
        if (response.status === 200) { 
            cluster(numWindows); 
        } else { 
            console.error("[Chrome Runtime Listener] Cluster failed.")
        }

    }

    else if (data.message === 'clusterUrl') { 
        chrome.tabs.query({ currentWindow: true }, tabs => groupByDomain(tabs)); 
    }

    else if (data.message === 'getNumWindows') { 
        console.log("bg js  get numWindows")
        chrome.tabs.query({ currentWindow: true }, tabs => sendResponse({ numWindows: tabs.length })); 
    }



});



