from setuptools import setup, find_packages

setup(
    name='my_package',
    version='0.1.0',
    description='A description of my package',
    author='Your Name',
    author_email='your.email@example.com',
    packages=find_packages(),  # Automatically find packages in the directory
    install_requires=[
        # List your package dependencies here
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)
