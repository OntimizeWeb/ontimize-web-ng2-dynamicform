import {
  Component,
  EventEmitter,
  OnInit,
  Optional,
  Inject,
  forwardRef,
  ViewEncapsulation,
  Injector,
  ElementRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import 'rxjs/add/observable/combineLatest';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import {
  OFormComponent,
  Util,
  OntimizeService,
  IFormDataTypeComponent,
  SQLTypes,
  InputConverter
} from 'ontimize-web-ng2/ontimize';

import { DynamicFormDefinition } from './o-dynamic-form.common';
import { ODynamicFormEvents } from './o-dynamic-form.events';
import { BaseOptions } from './components/base';

@Component({
  moduleId: module.id,
  selector: 'o-dynamic-form',
  templateUrl: 'o-dynamic-form.component.html',
  styleUrls: ['o-dynamic-form.component.css'],
  inputs: [
    'oattr : attr',
    'formDefinition: form-definition',
    'editMode : edit-mode',
    'entity',
    'keys',
    'columns',
    'service',
    'serviceType : service-type',
    'queryOnInit : query-on-init',
    'registerInParentForm : register-in-parent-form'
  ],
  outputs: [
    'render',
    'submit',
    'change',
    'onAddComponent',
    'onEditComponentSettings',
    'onDeleteComponent'
  ],
  encapsulation: ViewEncapsulation.None
})
export class ODynamicFormComponent implements OnInit, IFormDataTypeComponent {

  public ready: BehaviorSubject<boolean> = new BehaviorSubject(false);

  /* inputs */
  oattr: string;
  @InputConverter()
  editMode: boolean = false;
  entity: string;
  keys: string = '';
  columns: string = '';
  service: string;
  serviceType: string;
  @InputConverter()
  queryOnInit: boolean = true;
  @InputConverter()
  registerInParentForm: boolean = true;
  /* end of inputs */

  /*parsed inputs */
  innerFormDefinition: DynamicFormDefinition = null;
  keysArray: string[] = [];
  colsArray: string[] = [];
  dataService: any;
  /* end of parsed inputs */

  render: EventEmitter<any> = new EventEmitter();
  submit: EventEmitter<any> = new EventEmitter();
  change: EventEmitter<any> = new EventEmitter();

  onAddComponent: EventEmitter<any> = new EventEmitter();
  onEditComponentSettings: EventEmitter<any> = new EventEmitter();
  onDeleteComponent: EventEmitter<any> = new EventEmitter();


  protected onFormInitStream: EventEmitter<Object> = new EventEmitter<Object>();
  protected onUrlParamChangedStream: EventEmitter<Object> = new EventEmitter<Object>();
  protected reloadStream: Observable<any>;

  public loading: boolean = false;
  public formData: Object = {};

  protected urlParamSub: any;
  protected urlParams: Object;

  constructor(
    protected actRoute: ActivatedRoute,
    protected injector: Injector,
    public events: ODynamicFormEvents,
    protected elRef: ElementRef,
    @Optional() @Inject(forwardRef(() => OFormComponent)) protected parentForm: OFormComponent
  ) {

    this.reloadStream = Observable.combineLatest(
      this.onFormInitStream.asObservable(),
      this.onUrlParamChangedStream.asObservable()
    );

    var self = this;
    this.reloadStream.subscribe(
      function (valArr) {
        if (Util.isArray(valArr) && valArr.length === 2) {
          if (self.queryOnInit && valArr[0] === true && valArr[1] === true) {
            self.doQuery(true);
          }
        }
      });
  }

  ngOnInit() {
    if (this.formDefinition) {
      this.ready.next(true);
    }

    this.keysArray = Util.parseArray(this.keys);
    this.colsArray = Util.parseArray(this.columns);

    this.configureService();

    this.registerFormListeners();

    var self = this;
    this.urlParamSub = this.actRoute
      .params
      .subscribe(params => {
        self.urlParams = params;

        if (self.urlParams && Object.keys(self.urlParams).length > 0) {
          self.onUrlParamChangedStream.emit(true);
        }
      });
  }

  getSQLType(): number {
    return SQLTypes.OTHER;
  }

  getAttribute() {
    if (this.oattr) {
      return this.oattr;
    } else if (this.elRef && this.elRef.nativeElement.attributes['attr']) {
      return this.elRef.nativeElement.attributes['attr'].value;
    }
  }

  ngAfterViewInit() {
    this.onFormInitStream.emit(true);
  }

  configureService() {
    let loadingService: any = OntimizeService;
    if (this.serviceType) {
      loadingService = this.serviceType;
    }
    try {
      this.dataService = this.injector.get(loadingService);
      if (Util.isDataService(this.dataService)) {
        let serviceCfg = this.dataService.getDefaultServiceConfiguration(this.service);
        if (this.entity) {
          serviceCfg['entity'] = this.entity;
        }
        this.dataService.configureService(serviceCfg);
      }
    } catch (e) {
      console.error(e);
    }
  }

  registerFormListeners() {
    if (this.parentForm && this.registerInParentForm) {
      this.parentForm.registerFormComponent(this);
      this.parentForm.registerDynamicFormComponent(this);
      this.parentForm.registerSQLTypeFormComponent(this);
    }
  }

  unregisterFormListeners() {
    if (this.parentForm && this.registerInParentForm) {
      this.parentForm.unregisterFormComponent(this);
      this.parentForm.unregisterDynamicFormComponent(this);
      this.parentForm.unregisterSQLTypeFormComponent(this);
    }
  }

  setValue(val: any) {
    this.formDefinition = val;
  }

  protected getCurrentKeysValues() {
    let filter = {};
    if (this.urlParams && this.keysArray) {
      this.keysArray.map(key => {
        if (this.urlParams[key]) {
          filter[key] = this.urlParams[key];
        }
      });
    };
    return filter;
  }

  doQuery(useFilter: boolean = false) {
    let filter = {};
    if (useFilter) {
      filter = this.getCurrentKeysValues();
    }
    this.queryData(filter);
  }

  getAttributesToQuery() {
    let attributes: Array<any> = [];
    // add form keys...
    if (this.keysArray && this.keysArray.length > 0) {
      attributes.push(...this.keysArray);
    }
    if (this.oattr) {
      attributes.push(this.oattr);
    }
    return attributes;
  }

  _setData(data) {
    if (Util.isArray(data) && data.length === 1) {
      this.formData = data[0];
    } else if (Util.isObject(data)) {
      this.formData = data;
    } else {
      console.warn('DynamicForm has received not supported service data. Supported data are Array or Object');
    }
    if (this.oattr) {
      let dynamicData = this.formData[this.oattr];
      this.formDefinition = dynamicData;
    }
  }

  queryData(filter) {
    var self = this;
    var loader = self.load();
    if (this.dataService === undefined) {
      console.warn('No service configured! aborting query');
      return;
    }
    // let sqlTypes = this.getAttributesSQLTypes();
    this.dataService.query(filter, this.getAttributesToQuery(), this.entity)
      .subscribe(resp => {
        loader.unsubscribe();
        if (resp.code === 0) {
          self._setData(resp.data);
        } else {
          console.log('error ');
        }
      }, err => {
        console.log(err);
        loader.unsubscribe();
      });
  }

  getComponetsDef() {
    if (this.formDefinition && this.formDefinition.components) {
      return this.formDefinition.components;
    }
    let empty: Array<BaseOptions<any>> = [];
    return empty;
  }


  ngOnDestroy() {
    if (this.urlParamSub) {
      this.urlParamSub.unsubscribe();
    }
    this.unregisterFormListeners();
  }

  onRender() {
    // The form is done rendering.
    if (this.render) {
      this.render.emit(true);
    }
  }

  onDropEnd(event) {
    if (this.editMode) {
      this.onAddComponent.emit({
        component: event.dragData
      });
    }
  }

  load(): any {
    var self = this;
    var loadObservable = new Observable(observer => {
      var timer = window.setTimeout(() => {
        observer.next(true);
      }, 250);

      return () => {
        window.clearTimeout(timer);
        self.loading = false;
      };

    });
    var subscription = loadObservable.subscribe(val => {
      self.loading = val as boolean;
    });
    return subscription;
  }

  set formDefinition(definition) {
    let definitionJSON: any = definition;
    if (definition && typeof definition === 'string') {
      try {
        definitionJSON = JSON.parse(definition);
      } catch (e) {
        console.error('set formDefinition error');
      }
    }
    this.innerFormDefinition = definitionJSON;
  }

  get formDefinition() {
    return this.innerFormDefinition;
  }
}
