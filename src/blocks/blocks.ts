import * as Blockly from 'blockly/core';

export function defineBlocks() {
  // Check if the block is already defined to prevent redefinition
  if (!Blockly.Blocks['my_custom_block']) {
    Blockly.Blocks['my_custom_block'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("move forward")
            .appendField(new Blockly.FieldNumber(0), "STEPS");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Move forward by a specified number of steps");
        this.setHelpUrl("");
      }
    };
  }

  // Return the block definition with its JavaScript generator
  return [
    {
      type: 'my_custom_block',
      javascriptGenerator: function(block) {
        const number = block.getFieldValue('STEPS');
        return `moveForward(${number});\n`;
      }
    }
  ];
}