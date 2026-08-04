import { PlatformApiError } from './api.js';

/**
 * Error presentation (design system §E.8, Doc 20 §231–237). Four things
 * every message must answer: what happened, whether the person's work
 * survived, what did NOT happen, and what to do next. The technical code
 * is a detail for support, never the message itself — a participant
 * reading `AUTHORISATION_DENIED` learns nothing and is told nothing.
 *
 * Severity is a presentation decision, not a synonym for HTTP status:
 * level 1 is recoverable in place, level 2 blocks the action and needs a
 * route out, level 3 is safety-critical and takes over.
 */
export type ErrorSeverity = 1 | 2 | 3;

export interface PresentedError {
  severity: ErrorSeverity;
  title: string;
  /** What survived and what did not happen. */
  reassurance: string;
  /** Why, in plain language — omitted when we cannot say honestly. */
  reason?: string;
  /** The next thing the person can actually do. */
  nextStep: string;
  /** Technical code, shown only inside a details disclosure. */
  code: string;
}

const SUPPORT = '如果你觉得这不对，可以在「帮助与安全」里联系研究团队。';

/**
 * Protected existence (ADR-050): a 404 may mean the thing is not there OR
 * that this person may not know it exists. The wording must fit both, so
 * it never confirms existence and never blames the other person.
 */
const NOT_FOUND: Omit<PresentedError, 'code'> = {
  severity: 2,
  title: '现在打不开这一项',
  reassurance: '你之前填写的内容没有丢，也没有提交出去。',
  reason: '可能是标识不正确，或者这一项现在不对你开放。',
  nextStep: `请检查一下标识；${SUPPORT}`,
};

const BY_CODE: Record<string, Omit<PresentedError, 'code'>> = {
  AUTHENTICATION_REQUIRED: {
    severity: 2,
    title: '需要这个环境的访问口令',
    reassurance: '刚才的操作没有执行，你填写的内容还在。',
    reason: '这与你的账号和权限无关——它是这个研究原型环境的访问门。',
    nextStep: '在页面顶部的提示里输入访问口令，然后再试一次。',
  },
  AUTHORISATION_DENIED: {
    severity: 2,
    title: '现在不能做这件事',
    reassurance: '什么都没有改变，你填写的内容还在。',
    reason: '这个操作需要你尚未具备的条件，例如相关的同意选择或对方的批准。',
    nextStep: `可以先去「我的同意选择」看看相关选项；${SUPPORT}`,
  },
  RESOURCE_NOT_FOUND: NOT_FOUND,
  CONSENT_REQUIRED: {
    severity: 2,
    title: '这一步需要你的同意选择',
    reassurance: '什么都没有提交，你填写的内容还在。',
    reason: '相关的同意选择目前不是「已同意」。',
    nextStep: '去「我的同意选择」查看并更改；你随时可以再改回来。',
  },
  BLOCKED_INTERACTION: {
    severity: 2,
    title: '这条互动没有发生',
    reassurance: '没有发送任何内容，对方也不会收到通知。',
    reason: '你们之间存在屏蔽。',
    nextStep: '你可以在「帮助与安全」里查看和管理屏蔽。',
  },
  COMMUNICATION_BASIS_REQUIRED: {
    severity: 2,
    title: '还不能给这个人发消息',
    reassurance: '草稿已经保存，没有发送出去。',
    reason: '发消息需要你们之间有一段仍然有效的连接。',
    nextStep: '可以在「认识新朋友」里查看连接状态。',
  },
  VERSION_CONFLICT: {
    severity: 1,
    title: '这一项刚刚有了新的版本',
    reassurance: '你的修改没有丢，也没有覆盖别人的改动。',
    reason: '在你操作期间，这一项被更新过。',
    nextStep: '请先刷新看看最新内容，再决定是否继续。',
  },
  INVALID_STATE_TRANSITION: {
    severity: 1,
    title: '这一项现在的状态不允许这个操作',
    reassurance: '什么都没有改变。',
    nextStep: '刷新看看它现在的状态；状态变了之后可以再试。',
  },
  VALIDATION_FAILED: {
    severity: 1,
    title: '有一项还需要修改',
    reassurance: '你写的内容还在下面，没有丢。',
    nextStep: '按提示修改后再提交一次。',
  },
  STEP_UP_AUTHENTICATION_REQUIRED: {
    severity: 2,
    title: '这个操作需要更强的身份验证',
    reassurance: '操作没有执行，你填写的内容还在。',
    nextStep: '用强认证方式重新登录后再试。',
  },
  DEPENDENCY_UNAVAILABLE: {
    severity: 1,
    title: '暂时联系不上外部系统',
    reassurance: '你的内容没有丢，这一步也没有半途生效。',
    reason: '这是外部系统的问题，不是你操作有误。',
    nextStep: '过一会儿再试一次。',
  },
  RATE_LIMITED: {
    severity: 1,
    title: '操作太频繁了',
    reassurance: '内容没有丢。',
    nextStep: '稍等一下再试。',
  },
};

const NETWORK: Omit<PresentedError, 'code'> = {
  severity: 1,
  title: '没有连上服务器',
  reassurance: '你写的内容还在，这次操作没有提交出去。',
  nextStep: '检查网络后再试一次。',
};

const UNKNOWN: Omit<PresentedError, 'code'> = {
  severity: 1,
  title: '这一步没有成功',
  // Never claim to know what happened when we do not: an unmapped code
  // may or may not have taken effect, and saying otherwise would be a
  // guess presented as fact.
  reassurance: '你写的内容还在。',
  reason: '我们没能确定具体原因，也不确定这次操作是否已经生效。',
  nextStep: '请先刷新看看结果，不要直接重复提交；如果还有问题，请在「帮助与安全」里联系研究团队。',
};

export function presentError(err: unknown): PresentedError {
  if (!(err instanceof PlatformApiError)) return { ...NETWORK, code: 'NETWORK' };
  const code = err.error?.code ?? 'UNKNOWN';
  // A protected-existence 404 and a genuine missing record are the same
  // wording by design; see NOT_FOUND.
  const mapped = BY_CODE[code] ?? (err.status === 404 ? NOT_FOUND : UNKNOWN);
  return { ...mapped, code };
}
