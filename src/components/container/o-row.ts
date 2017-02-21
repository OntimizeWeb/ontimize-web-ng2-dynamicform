import { DFComponents } from '../components';
import { DFTemplate } from '../../o-dynamic-form.template';
import { BaseComponent, ComponentOptions } from '../base';
import { FormGroup } from '@angular/forms';
import { DEFAULT_INPUTS_O_ROW } from 'ontimize-web-ng2/ontimize';

export class ORowComponent extends BaseComponent<ComponentOptions<string, any>> {
  constructor(form: FormGroup, settings: any, data?: any) {
    super(form, settings, data);
  }

  getInputsProperties(): Array<any> {
    return DEFAULT_INPUTS_O_ROW;
  }

  isContainerComponent() {
    return true;
  }
}

export function ORow(template: DFTemplate) {
  DFComponents.register('o-row', ORowComponent, template.components['o-row']);
};
