from setuptools import setup, find_packages

setup(
    name='tab-cluster',
    version='0.1.0',
    description='',
    author='Nuha Rahman',
    author_email='nrahm777@gmail.com',
    packages=find_packages(),  # Automatically find packages in the directory
    install_requires=[
        "pandas",  
        "nltk" , 
        "numpy" ,
        "scikit-learn",
        "gensim"
        
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)
