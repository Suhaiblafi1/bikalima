# مسارات الاعتماد

## المحرك العام المستهدف

كل طلب يملك: النوع، مقدم الطلب، المورد، الحالة، الخطوة، المراجعين، التعليقات، المرفقات، SLA، القرارات وسجلها. لا يعتمد المستخدم طلبه في العمليات الحساسة.

## طلب المدرب

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted
  Submitted --> UnderReview
  UnderReview --> ChangesRequested
  ChangesRequested --> Resubmitted
  Resubmitted --> UnderReview
  UnderReview --> Approved
  UnderReview --> Rejected
  Approved --> Suspended
```
## الدورة

```mermaid
stateDiagram-v2
  Draft --> SubmittedForReview
  SubmittedForReview --> QualityReview
  QualityReview --> ChangesRequested
  ChangesRequested --> Draft
  QualityReview --> Approved
  Approved --> Scheduled
  Scheduled --> Published
  Published --> Archived
```

## الواجب والتقييم

```mermaid
stateDiagram-v2
  Draft --> Submitted
  Submitted --> UnderReview
  Submitted --> Late
  UnderReview --> ChangesRequested
  ChangesRequested --> Resubmitted
  Resubmitted --> UnderReview
  UnderReview --> Graded
  Graded --> Appealed
  Graded --> Finalized
  Appealed --> Finalized
```

## مشروع التخرج

```mermaid
stateDiagram-v2
  Idea --> ProposalSubmitted
  ProposalSubmitted --> SupervisorReview
  SupervisorReview --> ChangesRequested
  SupervisorReview --> Approved
  Approved --> InProgress
  InProgress --> MilestoneReview
  MilestoneReview --> FinalSubmission
  FinalSubmission --> InstructorEvaluation
  InstructorEvaluation --> CommitteeEvaluation
  CommitteeEvaluation --> Passed
  CommitteeEvaluation --> RevisionRequired
  CommitteeEvaluation --> Failed
  Passed --> PublishedToShowcase
```

## الشهادة

```mermaid
stateDiagram-v2
  PendingEligibility --> Eligible
  Eligible --> InstructorRecommendation
  InstructorRecommendation --> AdministrationReview
  AdministrationReview --> Approved
  Approved --> Issued
  Issued --> Revoked
  Revoked --> Reissued
```
