// @ts-nocheck
"use client"
import { useEffect } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import toolbox from '@/blocks/toolbox';
import {javascriptGenerator} from 'blockly/javascript';
Blockly.setLocale(En);



export default function Home() {
  // on cmd + enter, run the code
  useEffect(() => {
    const workspace = Blockly.getMainWorkspace();
    const onCmdEnter = (e) => {
      if (e.keyCode === 13 && e.metaKey) {
        const code = javascriptGenerator.workspaceToCode(workspace);
        alert(code)
        eval(code);
      }
    };
    document.addEventListener('keydown', onCmdEnter);
    return () => document.removeEventListener('keydown', onCmdEnter);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const blocklyDiv = document.getElementById('blocklyDiv');
      
      // Only initialize Blockly if the div exists and it hasn't been initialized yet
      if (blocklyDiv && blocklyDiv.children.length === 0) {
        const workspace = Blockly.inject(blocklyDiv, {
          toolbox: toolbox,
        });

        // Resize Blockly when the window is resized
        const onResize = () => Blockly.svgResize(workspace);
        window.addEventListener('resize', onResize);
        
        // Return a cleanup function to remove the resize listener
        return () => window.removeEventListener('resize', onResize);
      }
    }
  }, []);

  return (
    <div id="blocklyDiv" style={{ height: '100vh', width: '100%' }}></div>
  );
}
