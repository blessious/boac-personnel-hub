"use client";

import {
  createContext,
  useContext,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as Stepperize from "@stepperize/react";

import { cn } from "@/lib/utils";

type StepDefinition = {
  id: string;
  title?: string;
};

type StepState = "active" | "completed" | "inactive";

type StepperContextValue = {
  currentStepId: string;
  goTo: (stepId: string) => void;
  getIndex: (stepId: string) => number;
};

type StepItemContextValue = {
  stepId: string;
  state: StepState;
  disabled: boolean;
};

const StepperContext = createContext<StepperContextValue | null>(null);
const StepItemContext = createContext<StepItemContextValue | null>(null);

function useStepperContext() {
  const context = useContext(StepperContext);
  if (!context) throw new Error("Stepper components must be used inside Stepper");
  return context;
}

function useStepItemContext() {
  const context = useContext(StepItemContext);
  if (!context) throw new Error("Stepper item components must be used inside StepperItem");
  return context;
}

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: StepDefinition[];
  value: string;
  onValueChange?: (value: string) => void;
}

function Stepper({ steps, value, onValueChange, className, children, ...props }: StepperProps) {
  const definitionRef = useRef<ReturnType<typeof Stepperize.defineStepper> | null>(null);

  if (!definitionRef.current) {
    definitionRef.current = Stepperize.defineStepper(steps);
  }

  const stepper = definitionRef.current.useStepper({
    defaultStep: steps[0]?.id,
    step: value,
    onStepChange: (step) => onValueChange?.(step),
  });
  const currentStepId = stepper.id;

  const goTo = (stepId: string) => {
    void stepper.goTo(stepId);
  };

  return (
    <StepperContext.Provider
      value={{
        currentStepId,
        goTo,
        getIndex: (stepId) => steps.findIndex((step) => step.id === stepId),
      }}
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        data-slot="stepper"
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
}

interface StepperItemProps extends HTMLAttributes<HTMLDivElement> {
  stepId: string;
  disabled?: boolean;
}

function StepperItem({
  stepId,
  disabled = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { currentStepId, getIndex } = useStepperContext();
  const stepIndex = getIndex(stepId);
  const currentIndex = getIndex(currentStepId);
  const state: StepState =
    stepIndex < currentIndex ? "completed" : stepIndex === currentIndex ? "active" : "inactive";

  return (
    <StepItemContext.Provider value={{ stepId, state, disabled }}>
      <div
        data-slot="stepper-item"
        data-state={state}
        className={cn("group/step relative flex min-w-0 flex-1 items-center", className)}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

function StepperTrigger({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { currentStepId, goTo } = useStepperContext();
  const { stepId, state, disabled } = useStepItemContext();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={currentStepId === stepId}
      disabled={disabled}
      data-slot="stepper-trigger"
      data-state={state}
      className={cn(
        "relative z-10 inline-flex min-w-0 items-center gap-2.5 rounded-md bg-background pr-3 text-left outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none",
        className,
      )}
      onClick={() => goTo(stepId)}
      {...props}
    >
      {children}
    </button>
  );
}

function StepperIndicator({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  const { state } = useStepItemContext();

  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground transition-all duration-300",
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-2 data-[state=active]:ring-primary/30 data-[state=active]:ring-offset-2",
        "data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function StepperSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { state } = useStepItemContext();

  return (
    <div
      aria-hidden="true"
      data-slot="stepper-separator"
      data-state={state}
      className={cn(
        "mx-3 h-0.5 min-w-6 flex-1 bg-muted transition-colors duration-500",
        "group-data-[state=completed]/step:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

function StepperTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { state } = useStepItemContext();

  return (
    <h3
      data-slot="stepper-title"
      data-state={state}
      className={cn(
        "truncate text-sm font-medium text-muted-foreground transition-colors",
        "data-[state=active]:text-foreground data-[state=completed]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

function StepperNav({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav
      aria-label="Add employee progress"
      data-slot="stepper-nav"
      className={cn("flex w-full items-center", className)}
      {...props}
    >
      {children}
    </nav>
  );
}

export {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
};
