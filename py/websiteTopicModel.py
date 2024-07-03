import pandas as pd 
import string 
import numpy as np 
import os 
import matplotlib.pyplot as plt
from nltk import word_tokenize
from nltk.corpus import stopwords   
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF 
from collections import Counter 
from gensim.models.coherencemodel import CoherenceModel
from gensim.corpora.dictionary import Dictionary 
import math
import re 


class websiteTopicModel: 
    n_components: int 
    vectorizer: TfidfVectorizer
    file_paths: list[str]
    topics: list[list[str]]
    topic_doc_map: list[str]    
    nmf_model: NMF 
    ps: PorterStemmer 
    H: np.ndarray 
    W: np.ndarray 
    stopwords: stopwords
        

    def __init__(self, n_components): 
        self.n_components = n_components
        self.vectorizer = TfidfVectorizer(norm='l2', smooth_idf=True, max_df=0.95, ngram_range=(1, 3), stop_words='english')
        self.file_paths = []
        self.tfidf_matrix = None 
        self.tokens = None 
        self.W = None 
        self.ps = PorterStemmer()
        self.H = None 
        self.websites_preprocessed_data = [] 
        self.topics = [] 
        self.topic_doc_map = []

    def load_corpus_paths(self, path): 
        for filename in os.listdir(path): 
            file_path = path + filename 
            self.file_paths.append(file_path)
    

    def read_txt(self): 
        
        # read file contents by line 
        print("enter read_txt\n")
        for file_path in self.file_paths: 
            file = open(file_path, "r", encoding="utf-8")
            text = file.read() 
            text = re.sub(r'\n', '', text)
            text = re.sub(r'\d', '', text)
            text = text.translate(str.maketrans('', '', string.punctuation))
            text = text.strip()
            text = text.lower()
            tokenized_words = word_tokenize(text)
            tokenized_words = [self.ps.stem(word) for word in tokenized_words]
            self.websites_preprocessed_data.append(' '.join(tokenized_words)) 
        print("finished processing text\n")
        
    
    def create_tfidf_matrix(self): 
        if self.tfidf_matrix == None: 
            self.tfidf_matrix = self.vectorizer.fit_transform(self.websites_preprocessed_data)
            print("vectorizer created\n")
        else: 
            # add to tf-idf matrix if nmf already ran 
            self.tfidf_matrix = self.vectorizer.transform(self.websites_preprocessed_data)
            print("vectorizer updated\n")
        
    
    def generate_nmf_model(self): 
        print("entering generate_nmf_model\n")
        if (self.n_components == -1): 
            self.approximate_best_n()
        else: 
            self.nmf_model = NMF(n_components=self.n_components, random_state=1,  solver='mu')
            self.W = self.nmf_model.fit_transform(self.tfidf_matrix) 
            self.H = self.nmf_model.components_ 
    
    def convert_strings_to_words(self): 
        word_lists = [] 
        for website in self.websites_preprocessed_data: 
            words = website.split()
            word_lists.append(words)
        return word_lists 
    
    def recluster(self, new_components): 
        ## reinitialize 
        self.n_components = new_components
        self.file_paths = [] 
        self.websites_preprocessed_data = [] 
        self.topics = [] 
        self.topic_doc_map = []

        self.load_corpus_paths('../corpus/') 
        self.read_txt() 
        self.create_tfidf_matrix() 
        self.generate_nmf_model() 
        return self.map_topics_to_websites()



    def approximate_best_n(self):
        word_lists = self.convert_strings_to_words()
        dict = Dictionary(word_lists)
        corpus = [dict.doc2bow(text) for text in word_lists]
        max = len(self.file_paths)
        best_num_topics = 0 
        prev_coherence = 0 
        best_coherence_score = float('-inf')
        min = 2
        print("approximate_best_n: ", min, max)
        for i in range(2, max): # dont wanna have a window with just one page - open for suggestion on this one ?
            curr_topics = [] 
            self.nmf_model = NMF(n_components=i, random_state=60, solver='mu', init='nndsvda')
            self.W = self.nmf_model.fit_transform(self.tfidf_matrix)
            self.H = self.nmf_model.components_  
            curr_topics = self.get_topics()
            cm = CoherenceModel(topics=curr_topics, texts=word_lists, dictionary=dict, corpus=corpus, coherence='u_mass')
            curr_coherence = round(cm.get_coherence(), 5)
            print('(', i, ',', curr_coherence, ')')

            if (i != 2): 
                diff = abs(prev_coherence - curr_coherence) 
                if (diff < 0.5): 
                    best_num_topics = i 
                    break
                else: 
                    prev_coherence = curr_coherence
            else: 
                best_num_topics = i 
                prev_coherence = curr_coherence 


        print("best number of components: ", best_num_topics) 
        self.nmf_model = NMF(n_components=best_num_topics, random_state=60, solver='mu', init='nndsvda')
        self.W = self.nmf_model.fit_transform(self.tfidf_matrix)
        self.H = self.nmf_model.components_  


    def get_topics(self): 
        topics = [] 
        word_topics = [] 
        terms = self.vectorizer.get_feature_names_out()
        for index, topic in enumerate(self.H):
            topics.append([terms[i] for i in topic.argsort()[-3:]])
        for topic in topics: 
            word_topics.append([word for phrase in topic for word in phrase.split()])  
        return word_topics 

    def map_topics_to_websites(self): 
        self.topic_doc_map = {i: [] for i in range(self.nmf_model.n_components)}

        for doc_index, topic_scores in enumerate(self.W):
            max_topic_score = np.argmax(topic_scores)
            self.topic_doc_map[max_topic_score].append(self.file_paths[doc_index])
        
        print(self.topic_doc_map)
        return self.topic_doc_map
    
    def driver(self):
        self.load_corpus_paths('../corpus/')
        self.read_txt()
        self.create_tfidf_matrix()
        self.generate_nmf_model()

        return self.map_topics_to_websites()

    



def main(): 
    nmf_model = websiteTopicModel(n_components=-1)
    return nmf_model.driver() 


if __name__ == '__main__':
    topic_doc_map = main()