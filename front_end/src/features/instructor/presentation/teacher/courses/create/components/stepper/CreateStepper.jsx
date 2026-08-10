import {Check} from "lucide-react";

const STEPS = ["Course", "Sections", "Preview", "Publish"];

const CreateStepper = ({currentStep, onStepClick, canNavigateTo}) => {
    return (
        <nav className="teacher-create-stepper" aria-label="Course creation progress">
            {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isComplete = stepNumber < currentStep;
                const isClickable = !isActive && canNavigateTo?.(stepNumber);

                return (
                    <button
                        key={step}
                        type="button"
                        disabled={!isClickable}
                        onClick={() => isClickable && onStepClick?.(stepNumber)}
                        className={[
                            "teacher-create-stepper__item",
                            isActive ? "teacher-create-stepper__item--active" : "",
                            isComplete ? "teacher-create-stepper__item--complete" : "",
                            isClickable ? "teacher-create-stepper__item--clickable" : "",
                        ].filter(Boolean).join(" ")}
                        aria-current={isActive ? "step" : undefined}
                    >
                        <span>{isComplete ? <Check size={13}/> : stepNumber}</span>
                        <strong>{step}</strong>
                    </button>
                );
            })}
        </nav>
    );
};

export default CreateStepper;
