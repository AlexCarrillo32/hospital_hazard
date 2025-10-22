import { createLogger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ai-orchestrator');

export class AIOrchestrator {
  constructor() {
    this.workflows = new Map();
    this.agents = new Map();
    this.executions = new Map();
  }

  registerAgent(name, handler) {
    this.agents.set(name, {
      name,
      handler,
      executionCount: 0,
      totalLatency: 0,
    });

    logger.info(`Registered agent: ${name}`);
  }

  defineWorkflow(name, steps) {
    this.workflows.set(name, {
      name,
      steps,
      executionCount: 0,
    });

    logger.info(
      {
        workflow: name,
        stepCount: steps.length,
      },
      'Defined workflow'
    );
  }

  async executeWorkflow(workflowName, initialInput, _options = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    const executionId = uuidv4();
    const execution = {
      id: executionId,
      workflowName,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      steps: [],
      finalOutput: null,
      error: null,
    };

    this.executions.set(executionId, execution);

    logger.info(
      {
        executionId,
        workflow: workflowName,
      },
      'Starting workflow execution'
    );

    let context = { input: initialInput };

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepResult = await this._executeStep(
          executionId,
          step,
          context,
          i
        );

        execution.steps.push(stepResult);

        if (!stepResult.success) {
          throw new Error(
            `Step ${step.name} failed: ${stepResult.error.message}`
          );
        }

        context = this._mergeContext(context, stepResult.output);

        if (step.condition && !step.condition(context)) {
          logger.info(
            {
              executionId,
              step: step.name,
            },
            'Step condition not met, skipping remaining steps'
          );
          break;
        }
      }

      execution.status = 'completed';
      execution.finalOutput = context;
      workflow.executionCount += 1;

      logger.info(
        {
          executionId,
          workflow: workflowName,
        },
        'Workflow completed successfully'
      );

      return context;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;

      logger.error(
        {
          executionId,
          workflow: workflowName,
          error: error.message,
        },
        'Workflow execution failed'
      );

      throw error;
    } finally {
      execution.completedAt = new Date().toISOString();
    }
  }

  async _executeStep(executionId, step, context, stepIndex) {
    const { name, agent, input, retryOnFailure = false, maxRetries = 3 } = step;

    const agentInstance = this.agents.get(agent);
    if (!agentInstance) {
      throw new Error(`Agent not found: ${agent}`);
    }

    logger.info(
      {
        executionId,
        step: name,
        stepIndex,
        agent,
      },
      'Executing step'
    );

    let attempt = 0;
    let lastError;

    while (attempt < (retryOnFailure ? maxRetries : 1)) {
      try {
        const startTime = Date.now();

        const stepInput =
          typeof input === 'function' ? input(context) : context.input;

        const output = await agentInstance.handler(stepInput, context);

        const latencyMs = Date.now() - startTime;

        agentInstance.executionCount += 1;
        agentInstance.totalLatency += latencyMs;

        logger.info(
          {
            executionId,
            step: name,
            latencyMs,
            attempt: attempt + 1,
          },
          'Step completed successfully'
        );

        return {
          stepName: name,
          agent,
          success: true,
          output,
          latencyMs,
          attempt: attempt + 1,
        };
      } catch (error) {
        lastError = error;
        attempt += 1;

        logger.warn(
          {
            executionId,
            step: name,
            attempt,
            maxRetries,
            error: error.message,
          },
          'Step execution failed'
        );

        if (attempt < maxRetries) {
          await this._sleep(1000 * Math.pow(2, attempt));
        }
      }
    }

    return {
      stepName: name,
      agent,
      success: false,
      error: lastError,
      attempt,
    };
  }

  async executeParallel(agents, inputs, options = {}) {
    const { timeout = 30000 } = options;

    logger.info(
      {
        agentCount: agents.length,
        timeout,
      },
      'Starting parallel execution'
    );

    const promises = agents.map((agentName, index) => {
      const agent = this.agents.get(agentName);
      if (!agent) {
        return Promise.reject(new Error(`Agent not found: ${agentName}`));
      }

      return Promise.race([
        agent.handler(inputs[index] || inputs[0]),
        this._timeout(timeout),
      ]);
    });

    const results = await Promise.allSettled(promises);

    logger.info(
      {
        agentCount: agents.length,
        successCount: results.filter((r) => r.status === 'fulfilled').length,
      },
      'Parallel execution completed'
    );

    return results;
  }

  _mergeContext(existingContext, newData) {
    if (typeof newData === 'object' && !Array.isArray(newData)) {
      return { ...existingContext, ...newData };
    }

    return { ...existingContext, output: newData };
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), ms)
    );
  }

  getExecutionStatus(executionId) {
    return this.executions.get(executionId);
  }

  getWorkflowStats(workflowName) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    const executions = Array.from(this.executions.values()).filter(
      (e) => e.workflowName === workflowName
    );

    return {
      name: workflowName,
      totalExecutions: workflow.executionCount,
      successful: executions.filter((e) => e.status === 'completed').length,
      failed: executions.filter((e) => e.status === 'failed').length,
      running: executions.filter((e) => e.status === 'running').length,
    };
  }

  getAgentStats(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    return {
      name: agentName,
      executionCount: agent.executionCount,
      avgLatency:
        agent.executionCount > 0
          ? agent.totalLatency / agent.executionCount
          : 0,
    };
  }
}

export const orchestrator = new AIOrchestrator();
