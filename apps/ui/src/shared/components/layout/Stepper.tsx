interface StepperProps {
  currentStep: number;
  totalSteps: number;
  currentStepTitle: string;
  nextStepTitle: string;
}

export function Stepper({
  currentStep,
  totalSteps,
  currentStepTitle,
  nextStepTitle,
}: StepperProps) {
  return (
    <div className="fr-stepper fr-mb-4w">
      <h2 className="fr-stepper__title">
        {currentStepTitle}
        <span className="fr-stepper__state">
          Étape {currentStep} sur {totalSteps}
        </span>
      </h2>
      <div
        className="fr-stepper__steps"
        data-fr-current-step={currentStep}
        data-fr-steps={totalSteps}
      ></div>
      <p className="fr-stepper__details">
        <span className="fr-text--bold">Étape suivante :</span> {nextStepTitle}
      </p>
    </div>
  );
}
