import { variable } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TXEditor';
  inputContent = 'Input to the entry point function goes here'
  editorContent = "//**Welcome to TXEditor- Add your transformer function logic here.. \n"+
                  "// Use 'payload' as parameter to access parameter values in Input Pane\n" +
                  "// processMessage() will be the entrypoint of transformation logic\n"+
                  "function processMessage(message){\n\n" +
                  "\treturn message;"+
                  "\n}";
  outputContent = "Transformed data appear here..."
  consoleMessages : Array<String> = ["LOg1", "Log2", "Log3"] ;
  inputObject = {};
  outputObject = {};

  editorFocusChange = ( focused:Boolean) =>{
    if(focused){
      console.log("Code Editor focused...");
    }else{
      console.log("Code Editor lost focus...");
      console.log(this.editorContent);     
       //var executor = this.ScriptExecutorWrapper(this.editorContent);
       //executor();
       this.runScript(this, new Promise<string>((resolve, reject)=>{resolve(this.editorContent)} ));
       //this.outputContent = this.objectToText(this.outputObject);
      // console.log(this.outputContent);
    }
    
  }

  runButtonClicked = (event:any)=>{
    event.preventDefault();
    console.log("Run clicked..");
    this.runScript(this, new Promise<string>((resolve, reject)=>{resolve(this.editorContent)} ));
  } 

  inputFocusChange = ( focused:Boolean) =>{
    if(focused){
      console.log("Input Editor focused...");
    }else{
      console.log("Input Editor lost focus...");
      console.log(this.inputContent);     
       this.inputObject = JSON.parse(this.inputContent);       
    }    
  }

  runScript(thisRef:any,closure:Promise<string>) {

    const rawConsole = console;
    const appRef = thisRef;
    const payload = this.inputObject;
    var transformedPayload = {};
    var context = {} as any;
    closure.then(js => {
      var console = {};
      try {
        appRef.consoleMessages = [];
        const replace = {} as any;        
        bindLoggingFunc(replace, rawConsole, 'log', 'LOG');
        bindLoggingFunc(replace, rawConsole, 'error', 'ERR');
        
        //replace['clear'] = clearLogs
        console = Object.assign({}, rawConsole, replace)
        eval(wrapAroundTestFunction(js))
        appRef.outputObject = transformedPayload;
        appRef.outputContent = JSON.stringify(transformedPayload, undefined, 2)
        //appRef.outputContent = appRef.objectToText(transformedPayload)
      } catch (error) {
        //console.error(i("play_run_js_fail"))
        console.error(error);
      }      
    })

    context["log"] = (...objs:any[])=>{
      appRef.consoleMessages.push(objs);
    };

    function wrapAroundTestFunction(processMessageCode:string):string{
      var wrappedTranformationCode  = processMessageCode + "\n";
      var testFunctionCode = "function testProcessMessage(){\n"+
                                  "transformedPayload = processMessage(payload);\n"+
                                  "}\n"+
                              "testProcessMessage();\n";
      return wrappedTranformationCode + testFunctionCode;
    }
    
    function bindLoggingFunc(obj: any, raw: any, name: string, id: string) {
      obj[name] = function (...objs: any[]) {
        appRef.consoleMessages.push(objs);
        raw[name](...objs)
      }
    }
  }

  objectToText = (arg: any): string => {
    const isObj = typeof arg === "object"
    let textRep = ""
    if (arg && arg.stack && arg.message) {
      // special case for err
      textRep = arg.message
    } else if (arg === null) {
      textRep = "<span class='literal'>null</span>"
    } else if (arg === undefined) {
      textRep = "<span class='literal'>undefined</span>"
    } else if (Array.isArray(arg)) {
      textRep = "[" + arg.map(this.objectToText).join("<span class='comma'>, </span>") + "]"
    } else if (typeof arg === "string") {
      textRep = '"' + arg + '"'
    } else if (isObj) {
      const name = arg.constructor && arg.constructor.name
      // No one needs to know an obj is an obj
      const nameWithoutObject = name && name === "Object" ? "" : name
      const prefix = nameWithoutObject ? `${nameWithoutObject}: ` : ""
      textRep = prefix + JSON.stringify(arg, null, 2)
    } else {
      textRep = arg as any
    }
    return textRep
  }
  //Script Exec wrapper closure
  //Script Exec wrapper closure
   ScriptExecutorWrapper(scriptStr: String) {
    var scriptCode = scriptStr;
    var systemLogMethod = console.log;
    this.consoleMessages = [];
    console.log = (msg:string)=>{
      this.consoleMessages.push(msg);
      systemLogMethod.apply(console, ['log', msg]);
    }
    return ()=>(scriptCode);
  }

  
  
}