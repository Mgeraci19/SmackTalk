import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PromptCard, ATTACK_TYPES } from "./PromptCard";
import { Id } from "../../../../convex/_generated/dataModel";

describe("PromptCard", () => {
    const mockPrompt = {
        _id: "prompt-1" as Id<"prompts">,
        text: "What's funnier than 24?"
    };

    const mockShowError = vi.fn();

    test("renders without attack type selector when showAttackTypeSelector is false", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={false}
            />
        );

        expect(screen.queryByTestId(`attack-type-selector-${mockPrompt._id}`)).not.toBeInTheDocument();
        expect(screen.getByTestId(`answer-input-${mockPrompt._id}`)).toBeInTheDocument();
    });

    test("renders without attack type selector when showAttackTypeSelector is undefined", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
            />
        );

        expect(screen.queryByTestId(`attack-type-selector-${mockPrompt._id}`)).not.toBeInTheDocument();
    });

    test("renders attack type selector when showAttackTypeSelector is true", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        expect(screen.getByTestId(`attack-type-selector-${mockPrompt._id}`)).toBeInTheDocument();
        expect(screen.getByText("Choose Your Attack")).toBeInTheDocument();

        // All three attack types should be visible
        expect(screen.getByTestId(`attack-type-jab-${mockPrompt._id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`attack-type-haymaker-${mockPrompt._id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`attack-type-flyingKick-${mockPrompt._id}`)).toBeInTheDocument();
    });

    test("jab is selected by default", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        const jabButton = screen.getByTestId(`attack-type-jab-${mockPrompt._id}`);
        expect(jabButton).toHaveAttribute("data-selected", "true");

        const haymakerButton = screen.getByTestId(`attack-type-haymaker-${mockPrompt._id}`);
        expect(haymakerButton).toHaveAttribute("data-selected", "false");

        const flyingKickButton = screen.getByTestId(`attack-type-flyingKick-${mockPrompt._id}`);
        expect(flyingKickButton).toHaveAttribute("data-selected", "false");
    });

    test("clicking attack type button selects it", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        const haymakerButton = screen.getByTestId(`attack-type-haymaker-${mockPrompt._id}`);
        fireEvent.click(haymakerButton);

        expect(haymakerButton).toHaveAttribute("data-selected", "true");
        expect(screen.getByTestId(`attack-type-jab-${mockPrompt._id}`)).toHaveAttribute("data-selected", "false");
    });

    test("displays correct multiplier info for each attack type", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        // Check that multiplier text is displayed
        expect(screen.getByText(/Deal 1× \/ Take 1×/)).toBeInTheDocument();
        expect(screen.getByText(/Deal 2× \/ Take 2×/)).toBeInTheDocument();
        expect(screen.getByText(/Deal 3× \/ Take 4×/)).toBeInTheDocument();
    });

    test("shows description for selected attack type", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        // Jab is selected by default
        expect(screen.getByText("Safe and steady")).toBeInTheDocument();

        // Select haymaker
        fireEvent.click(screen.getByTestId(`attack-type-haymaker-${mockPrompt._id}`));
        expect(screen.getByText("High risk, high reward")).toBeInTheDocument();

        // Select flying kick
        fireEvent.click(screen.getByTestId(`attack-type-flyingKick-${mockPrompt._id}`));
        expect(screen.getByText("Maximum damage, but very risky!")).toBeInTheDocument();
    });

    test("submits with jab attack type by default when selector is shown", async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        const input = screen.getByTestId(`answer-input-${mockPrompt._id}`);
        fireEvent.change(input, { target: { value: "25!" } });

        const submitButton = screen.getByTestId(`submit-answer-${mockPrompt._id}`);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith("25!", "jab");
        });
    });

    test("submits with selected attack type", async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        // Select flying kick
        fireEvent.click(screen.getByTestId(`attack-type-flyingKick-${mockPrompt._id}`));

        const input = screen.getByTestId(`answer-input-${mockPrompt._id}`);
        fireEvent.change(input, { target: { value: "YOLO!" } });

        const submitButton = screen.getByTestId(`submit-answer-${mockPrompt._id}`);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith("YOLO!", "flyingKick");
        });
    });

    test("submits without attack type when selector is not shown", async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={false}
            />
        );

        const input = screen.getByTestId(`answer-input-${mockPrompt._id}`);
        fireEvent.change(input, { target: { value: "25!" } });

        const submitButton = screen.getByTestId(`submit-answer-${mockPrompt._id}`);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith("25!", undefined);
        });
    });

    test("submit button shows attack type data attribute when selector is shown", () => {
        const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <PromptCard
                prompt={mockPrompt}
                initialValue=""
                isDone={false}
                onSubmit={mockOnSubmit}
                showError={mockShowError}
                showAttackTypeSelector={true}
            />
        );

        const submitButton = screen.getByTestId(`submit-answer-${mockPrompt._id}`);
        expect(submitButton).toHaveAttribute("data-attack-type", "jab");

        // Change selection
        fireEvent.click(screen.getByTestId(`attack-type-haymaker-${mockPrompt._id}`));
        expect(submitButton).toHaveAttribute("data-attack-type", "haymaker");
    });
});

describe("ATTACK_TYPES constant", () => {
    test("has 3 attack types", () => {
        expect(ATTACK_TYPES).toHaveLength(3);
    });

    test("jab has correct values", () => {
        const jab = ATTACK_TYPES.find(a => a.type === "jab");
        expect(jab).toBeDefined();
        expect(jab?.dealtMultiplier).toBe("1×");
        expect(jab?.receivedMultiplier).toBe("1×");
        expect(jab?.riskLevel).toBe("low");
    });

    test("haymaker has correct values", () => {
        const haymaker = ATTACK_TYPES.find(a => a.type === "haymaker");
        expect(haymaker).toBeDefined();
        expect(haymaker?.dealtMultiplier).toBe("2×");
        expect(haymaker?.receivedMultiplier).toBe("2×");
        expect(haymaker?.riskLevel).toBe("medium");
    });

    test("flying kick has correct values", () => {
        const flyingKick = ATTACK_TYPES.find(a => a.type === "flyingKick");
        expect(flyingKick).toBeDefined();
        expect(flyingKick?.dealtMultiplier).toBe("3×");
        expect(flyingKick?.receivedMultiplier).toBe("4×");
        expect(flyingKick?.riskLevel).toBe("high");
    });
});
