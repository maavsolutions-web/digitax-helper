import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { TopBar } from "@/components/TopBar";
import { MaavLogo } from "@/components/MaavLogo";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const sendOtp = () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    toast.success("OTP sent to +91 " + phone);
    setStep("otp");
  };

  const verify = () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-md py-10 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-card sm:p-9 animate-fade-in">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            {step === "phone" ? <Phone className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>

          {step === "phone" ? (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight">Sign in with mobile</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">We'll send a 6-digit OTP. No passwords.</p>

              <label className="mt-7 block text-xs font-medium text-muted-foreground">Mobile number</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-background pl-3.5 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-sm font-medium text-muted-foreground">+91</span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="border-0 bg-transparent text-base tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <Button onClick={sendOtp} variant="hero" size="lg" className="mt-6 w-full">
                Send OTP <ArrowRight />
              </Button>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms & Privacy Policy.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight">Enter OTP</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sent to +91 {phone}.{" "}
                <button onClick={() => setStep("phone")} className="font-medium text-primary hover:underline">
                  Change
                </button>
              </p>

              <div className="mt-7 flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={verify} variant="hero" size="lg" className="mt-7 w-full">
                Verify & Continue <ArrowRight />
              </Button>

              <button
                onClick={() => toast.success("OTP resent")}
                className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Didn't receive it? <span className="font-medium text-primary">Resend</span>
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>
      </main>
    </div>
  );
};

export default Signup;
