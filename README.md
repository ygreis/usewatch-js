# usewatch-js
State management for local and global variables in javascript

## Features

* [Local states](#local-states)
* [Global states](#global-states)
* [Observer of local and global states](#usewatch-properties)

## Install

With [NPM](https://www.npmjs.com/package/usewatch-js)

``` 

npm i usewatch-js

```

With [UNPKG](https://unpkg.com/usewatch-js/dist/usewatch-js.min.js), add the script below to your page

```html 
<script src="https://unpkg.com/usewatch-js/dist/usewatch-js.min.js"></script>
```

[File minified](https://raw.githubusercontent.com/ygreis/usewatch-js/master/dist/usewatch-js.min.js)


## Usage

#### <a name="local-states">Local state</a>

```js

import {setState, useWatch} from 'usewatch-js';

const count = setState(0);

// When using useWatch it triggers the first time taking the initial value
useWatch(() => {
    console.log('count', count.value);
}, [count])

count.value++;
// output useWatch = count 1;

count.value = 3;
// output useWatch = count 3;

```

#### <a name="global-states">Global state</a>

```js
// Create a example file (example.js)

import {setState, useWatch} from 'usewatch-js';

const data = setState('keyName', {
  text: 'Example text'
});


useWatch(() => {
  console.log(data.text);
}, [data])

data.text = "Test 2";
// output useWatch = Test 2


/**
* Now let's use the same state in another file
* In the other file the usage looks like this
*/

// Example file (example-two.js)

import {useState, useWatch} from 'usewatch-js';

const data = useState('keyName');

useWatch(() => {
  console.log(`In file example-two.js = ${data.text}`);
}, [data])

// Here it will display in the console:

// In file example-two.js = Example text
// In file example-two.js = Test 2

```

#### <a name="usewatch-properties">useWatch properties</a>

```js

import {setState, useWatch} from 'usewatch-js';

const str = setState('Test');
const anyNumber = setState(1);

useWatch((strArg, numArg) => {
    console.log('strArg', strArg);
    console.log('numArg', numArg);
}, [str, anyNumber])

// output useWatch = 
/*
  // strArg
  {
    "value": 'Test',
    "oldValue": 'Test',
    "hasChanged": true
  }

  // numArg
  {
    "value": 1,
    "oldValue": 1,
    "hasChanged": true
  }
*/

str.value = 'Test number two';

/*
  // strArg
  {
    "value": 'Test number two',
    "oldValue": 'Test',
    "hasChanged": true
  }

  // numArg
  {
    "value": 1,
    "oldValue": 1,
    "hasChanged": false
  }
*/

```