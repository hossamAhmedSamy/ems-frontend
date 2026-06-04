import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { SelectField } from '../../components/ui/Select';
import { useCreateCompany } from '../../hooks/useCompanies';
import { ApiError } from '../../lib/api';
import type { SubscriptionTier } from '../../lib/types';

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  slug: z
    .string()
    .min(1, 'Required')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  ceoFullName: z.string().min(1, 'Required'),
  ceoUsername: z.string().min(3, 'Min 3 chars'),
  ceoEmail: z.string().email().optional().or(z.literal('')),
  ceoPassword: z.string().min(8, 'Min 8 chars'),
  tier: z.enum(['Free', 'Pro', 'Ultimate']),
  trialDays: z.coerce.number().int().min(0).max(365),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function CreateCompanyModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const createCompany = useCreateCompany();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tier: 'Free', trialDays: 14 },
  });
  const tier = watch('tier');

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await createCompany.mutateAsync({
        name: values.name,
        slug: values.slug,
        ceo: {
          fullName: values.ceoFullName,
          username: values.ceoUsername,
          email: values.ceoEmail || null,
          password: values.ceoPassword,
        },
        subscription: { tier: values.tier, status: 'Trialing', trialDays: values.trialDays },
      });
      reset();
      onOpenChange(false);
      navigate(`/super-admin/companies/${res.companyId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Network error' });
      }
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="New company"
      description="Provision a tenant with an initial CEO account."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={createCompany.isPending}>
            Create company
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Company">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="Acme Co" />
          </Field>
          <Field label="Slug" error={errors.slug?.message} hint="Used in API calls">
            <Input {...register('slug')} placeholder="acme" />
          </Field>
        </Section>

        <Section title="Initial CEO">
          <Field label="Full name" error={errors.ceoFullName?.message}>
            <Input {...register('ceoFullName')} />
          </Field>
          <Field label="Username" error={errors.ceoUsername?.message}>
            <Input {...register('ceoUsername')} />
          </Field>
          <Field label="Email (optional)" error={errors.ceoEmail?.message}>
            <Input type="email" {...register('ceoEmail')} />
          </Field>
          <Field label="Password" error={errors.ceoPassword?.message}>
            <Input type="password" {...register('ceoPassword')} />
          </Field>
        </Section>

        <Section title="Subscription">
          <Field label="Tier">
            <SelectField
              value={tier}
              onValueChange={(v) => setValue('tier', v as SubscriptionTier)}
              options={[
                { value: 'Free', label: 'Free' },
                { value: 'Pro', label: 'Pro' },
                { value: 'Ultimate', label: 'Ultimate' },
              ]}
            />
          </Field>
          <Field label="Trial days" error={errors.trialDays?.message}>
            <Input type="number" min={0} max={365} {...register('trialDays')} />
          </Field>
        </Section>

        {errors.root && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {errors.root.message}
          </div>
        )}
      </form>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </legend>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
