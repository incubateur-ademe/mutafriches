export interface Component {
  name: string;
  data: Record<string, any>;
}

export interface Page {
  name: string;
  data: Record<string, any>;
}

export interface StepConfig {
  title: string;
  nextTitle: string;
  page: string;
}

export interface StepConfigMap {
  [key: number]: StepConfig;
}

export interface StepData {
  currentStep: number;
  totalSteps: number;
  showPrevious: boolean;
  showNext: boolean;
  previousStep: number;
  nextStep: number;
}
