import { DFComponents } from '../../components';
import { DFTemplate } from '../../../o-dynamic-form.template';
import { InputComponent, InputOptions } from '../input';
import { FormGroup } from '@angular/forms';
import { DEFAULT_INPUTS_O_NIF_INPUT } from 'ontimize-web-ng2/ontimize';

export class TextFieldComponent extends InputComponent<InputOptions> {
  constructor(form: FormGroup, settings: any, data?: any) {
    super(form, settings, data);
  }

  getInputsProperties(): Array<any> {
    return DEFAULT_INPUTS_O_NIF_INPUT;
  }
}

export function ONifInput(template: DFTemplate) {
  DFComponents.register('o-nif-input', TextFieldComponent, template.components['o-nif-input']);
};
