import { variable } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import SampleMessage from '../assets/sample-message.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  title = 'TXEditor';
  inputContentJS = JSON.stringify({'msg':'A sample Message'}, undefined, 2)
  inputContentSQL = JSON.stringify( SampleMessage, undefined, 2)
  inputContent = this.inputContentJS //'Input to the entry point function goes here'
  editorContentJS = "//**Add your transformer function logic here.. \n"+                  
                  "//**NOTE**: Do not change/delete processMessage() or its signature. It is the entrypoint of transformation logic\n"+
                  "function processMessage(message){\n" +
                  "\t//You logic goes here...\n\n" +
                  "\treturn message;"+
                  "\n}";
  editorContent = this.editorContentJS
  editorContentSQL = "//Define your route query condition and evaluate here.\n\n"+
                    "True";
  outputContent = "Transformed data appear here..."
  consoleMessages : Array<String> = [] ;
  editors:Array<any> = [{DisplayText:"Transformer Function Editor",
                         Value:"javascript" },
                        {DisplayText:"Route Query Editor",
                        Value:"text/x-sql"}];
  inputObject = {};
  outputObject = {};
  cmEditorPane:any = {};
  cmEditorPaneOptions :CMOptions = {
      lineNumbers: true,
      theme: 'mbo',     
      mode: 'javascript',
      gutters: ['CodeMirror-lint-markers'],  
      lint: true        
  }
  selectedItem:any = this.editors[0];
  paneTitle:String = this.editors[0].DisplayText;


  editorFocusChange = ( focused:Boolean) =>{
    if(focused){
      console.log("Code Editor focused...");
      console.log(JSON.stringify(this.cmEditorPane))
      this.cmEditorPaneOptions.lineNumbers = true
    }else{
      console.log("Code Editor lost focus...");
      console.log(this.editorContent); 
      this.cmEditorPaneOptions.lineNumbers = false      
     // this.runScript(this, new Promise<string>((resolve, reject)=>{resolve(this.editorContent)} ));
      
    }
    
  }

  runButtonClicked = (event:any)=>{
    event.preventDefault();
    console.log("Run clicked..");
    this.runScript(this.selectedItem.Value, new Promise<string>((resolve, reject)=>{resolve(this.editorContent)} ));
  } 

  dropDownSelectionChange = (event:any)=>{
    console.log("Selected Item..(" + this.selectedItem.Value + ")" + this.selectedItem.DisplayText);
    this.paneTitle = this.selectedItem.DisplayText
    this.cmEditorPaneOptions.mode = this.selectedItem.Value;

    if(this.selectedItem.Value === "javascript"){
      this.editorContentSQL = this.editorContent
      this.editorContent = this.editorContentJS
      this.inputContent = this.inputContentJS
    }
    else{
      this.editorContentJS = this.editorContent
      this.editorContent = this.editorContentSQL
      this.inputContent = this.inputContentSQL
    }
  }
  inputFocusChange = ( focused:Boolean) =>{
    if(focused){
      console.log("Input Editor focused...");
    }else{
      console.log("Input Editor lost focus...");
      console.log(this.inputContent);     
      // this.inputObject = JSON.parse(this.inputContent);       
    }    
  }

  
  runScript(scriptType:string, closure:Promise<string>){

    switch (scriptType){
      case 'javascript':
        console.log("Executing JS script...")
        this.runScriptJS(this, closure);
        break;
      case 'text/x-sql':
        console.log("Executing SQL script...")
        this.runScriptSQL(this, closure)
        break
    }

  }
  
  runScriptJS(thisRef:any,closure:Promise<string>) {

    const rawConsole = console;
    const appRef = thisRef;
    const payload = JSON.parse(this.inputContent);
    var transformedPayload = {};
    var context = {} as any;
    closure.then(js => {
      var console = { 
        error:(msg:String)=>{}
      };
      
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

  runScriptSQL(thisRef:any,closure:Promise<string>){

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

interface CMOptions{
  lineNumbers: boolean,
  theme: string,     
  mode: string,
  gutters: Array<string>,  
  lint: boolean    
}