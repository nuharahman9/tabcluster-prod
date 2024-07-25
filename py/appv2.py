from websiteTopicModelv2 import websiteTopicModel
import json 
import gc
import pandas as pd 

gc.enable()
gc.set_debug(gc.DEBUG_LEAK)



nmf_model = None 
url_id_map = {} # will map urls to ids, for faster lookup even thoguh its a little redundant 
website_data = pd.DataFrame(columns=['url', 'id', 'text']);  # url and corresponding text 

# modify to either call storage apis 
def cleanup(): 
    global website_data
    global url_id_map
    website_data.drop(website_data.index)
    url_id_map = {} 




# pages[i] = dict of url, id, text
def upload_text(tabs): 
    pages = json.loads(tabs)
    print(len(pages))
    global url_id_map
    global website_data
    try: 
        for page in pages:
            url = page['url'] 
            id = page['id']
            if page['url'] and page['text']:
                url_id_map[url] = id 
                website_data.loc[len(website_data)] = page
            else: 
                print("something happened with: ", url)
        return json.dumps({ 'status': 200, 'message': "data upload complete"})
    except: 
        return json.dumps({ 'status': 400, 'message': 'F' })

   


# expected 
# num windows = int 
def cluster(numWindows): 
    global url_id_map
    global nmf_model 

    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    if nmf_model is None: 
        nmf_model = websiteTopicModel(n_components=numWindows) 
        topic_doc_map = nmf_model.driver() 
    else: 
        topic_doc_map = nmf_model.recluster(new_components=numWindows)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    print(topic_doc_map)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    if topic_doc_map:  
        for topicNum, file_paths in topic_doc_map.items(): 
            print(f"Topic {topicNum}:")
            for file in file_paths: 
                print(f"  - {file}")
                if topicNum not in topics_website_ids_map: 
                    topics_website_ids_map[topicNum] = [url_id_map[file]]
                else: 
                    topics_website_ids_map[topicNum].append(url_id_map[file])
        print(topics_website_ids_map) 
        cleanup()

        return topics_website_ids_map
    else: 
        return "something went wrong."