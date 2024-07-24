from websiteTopicModelv2 import websiteTopicModel
import pandas as pd 

nmf_model = None 
url_id_map = {} 


# modify to either call storage apis 
def cleanup(): 
    print("in cleanup\n")
    for filepath, id in url_id_map.items(): 
        if os.path.exists(filepath): 
            try: 
                os.remove(filepath)
                print(f"{filepath} deleted\n")
            except Exception as e: 
                print("An error occured deleting files: {e}")





def upload_txt(tabs): 
    print(tabs)
    


    # print(len(tabs))
    # global url_id_map
    # try: 
    #     for tab in tabs:
    #         url = tab['tab']['url'] 
    #         text = tab['text']
    #         title = tab['tab']['title']
    #         id = tab['tab']['id']
    #         if url and text:
    #             filename = url.replace('http://', '').replace('https://', '').replace('/', '_').replace('www.', '')
    #             # truncate file name 
    #             filename = filename[:45] if len(filename) > 45 else filename 
    #             filename += '.txt'
    #             filepath = os.path.join(UPLOAD_FOLDER, filename) # create file under tab id 
    #             print(id, filepath)
    #             url_id_map[filepath] = id 
    #             with open(filepath, 'a', encoding='utf-8') as file:
    #                 file.write(url) 
    #                 file.write('\n')
    #                 file.write(title)
    #                 file.write('\n')
    #                 file.write(text)
    #         else: 
    #             print("something happened with: ", url)
    #     return jsonify({ 'status': 200, 'message': "data upload complete"})
    # except: 
    #     return jsonify({ 'status': 400, 'message': 'F' })

   







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