# multi-entry-plugin
> set webpack multiple entry by single entry.

## Install
```
    npm i multi-entry-plugin --save-dev
```

## Example
src:
```
   ├── src                            
   |   ├── public                     
   |   |   ├── index.js        
   |   ├── page                      
   |   |   ├── index.js                  
   |   └── index.js                    
```

webpack.config.js:
```javascript
    import MultiEntryPlugin from 'multi-entry-plugin';

    const config = {
      entry: {
        'app': './src/index.js'
      },
      // ...
      plugins: [
            new MultiEntryPlugin({
              // plugin will depend directory of 'mainEntry' to set multiple entry.
              mainEntry: 'app' 
            })
        ]
    }
```

dist:
```
   ├── dist                            
   |   ├── public                     
   |   |   ├── index.js        
   |   ├── page                      
   |   |   ├── index.js                  
   |   └── index.js                    
```
