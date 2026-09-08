// Centered modal card, mirroring shadcn's DialogContent/Header.
import { X } from 'lucide-react-native';
import React, { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: string;
}

export function Dialog({ open, onClose, title, description, children }: PropsWithChildren<Props>) {
  const { colors } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="flex-1 items-center justify-center bg-black/40 px-5" onPress={onClose}>
          <Pressable className="max-h-[85%] w-full rounded-xl border border-border bg-card" onPress={() => {}}>
            <View className="flex-row items-start justify-between px-5 pt-5">
              <View className="flex-1 gap-1">
                {typeof title === 'string' ? <Text className="text-lg font-semibold text-foreground">{title}</Text> : title}
                {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
              </View>
              <Pressable onPress={onClose} className="p-1">
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="px-5 pb-5 pt-4" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
